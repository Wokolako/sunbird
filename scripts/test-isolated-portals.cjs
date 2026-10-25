const { spawn, execFileSync } = require("node:child_process");
const { DatabaseSync } = require("node:sqlite");
const { scryptSync, randomBytes } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { chromium } = require("../../../fivemilli/node_modules/playwright");
const next = require.resolve("next/dist/bin/next");
const root = process.cwd();
const report = path.resolve(".impeccable/review");
fs.mkdirSync(report, { recursive: true });
const file = path.resolve(`.impeccable/portal-test-${Date.now()}.sqlite`);
const seed = new DatabaseSync(file);
const password = randomBytes(20).toString("hex");
const salt = randomBytes(16).toString("hex");
seed.exec(
  "CREATE TABLE users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,phone TEXT NOT NULL DEFAULT '',password_hash TEXT NOT NULL,role TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
);
seed
  .prepare("INSERT INTO users(id,name,email,password_hash,role) VALUES(?,?,?,?,?)")
  .run(
    "test-admin",
    "Test Super Admin",
    "admin@vabbot.test",
    salt + ":" + scryptSync(password, salt, 64).toString("hex"),
    "admin"
  );
seed.close();
const children = [];
const accounts = {};
async function api(port, method, body, cookie = "", view = "session") {
  const res = await fetch(
    `http://localhost:${port}/api/platform${method === "GET" ? "?view=" + view : ""}`,
    {
      method,
      redirect: "manual",
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        ...(method === "POST" && !(body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body:
        method === "POST"
          ? body instanceof FormData
            ? body
            : JSON.stringify(body)
          : undefined,
    }
  );
  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  return {
    status: res.status,
    data,
    cookie: res.headers.get("set-cookie")?.split(";")[0],
  };
}
async function ok(port, body, cookie) {
  const r = await api(port, "POST", body, cookie);
  assert.ok(
    r.status < 300,
    JSON.stringify({ action: body.action, status: r.status, error: r.data.error })
  );
  return r;
}
(async () => {
  let browser;
  try {
    for (const [portal, port] of [
      ["guest", 3100],
      ["management", 3101],
      ["admin", 3102],
    ]) {
      const log = fs.openSync(path.join(report, `test-${portal}.log`), "w");
      const child = spawn(process.execPath, [next, "dev", "--port", String(port)], {
        cwd: root,
        env: {
          ...process.env,
          APP_PORTAL: portal,
          DATABASE_PATH: file,
          NEXT_BUILD_DIR: `.next-test-${portal}`,
        },
        stdio: ["ignore", log, log],
      });
      children.push(child);
    }
    for (const port of [3100, 3101, 3102]) {
      let ready = false;
      for (let i = 0; i < 90; i++) {
        try {
          const r = await api(port, "GET");
          if (r.status === 200) {
            ready = true;
            break;
          }
        } catch {}
        await new Promise((r) => setTimeout(r, 1000));
      }
      assert.ok(ready, `Port ${port} must start`);
      console.log(`Portal ${port} ready`);
    }
    const admin = await ok(3102, {
      action: "login",
      email: "admin@vabbot.test",
      password,
    });
    accounts.admin = admin.cookie;
    assert.ok(admin.cookie.startsWith("vabbot_admin_session="));
    async function manager(email, name) {
      const r = await ok(3101, {
        action: "register-owner",
        name,
        email,
        phone: "0991234567",
        password,
        organisationName: name + " hotels",
        organisationType: "hotel",
        registrationNumber: "TEST-REG",
        address: "London, United Kingdom",
      });
      return r;
    }
    const owner = await manager("owner@vabbot.test", "Test Manager");
    accounts.owner = owner.cookie;
    const other = await manager("other@vabbot.test", "Other Manager");
    accounts.other = other.cookie;
    const guest = await ok(3100, {
      action: "register-guest",
      name: "Test Guest",
      email: "guest@vabbot.test",
      phone: "0997654321",
      password,
    });
    accounts.guest = guest.cookie;
    assert.ok(guest.cookie.startsWith("vabbot_guest_session="));
    assert.ok(owner.cookie.startsWith("vabbot_owner_session="));
    assert.equal(
      (await api(3100, "POST", { action: "login", email: "owner@vabbot.test", password }))
        .status,
      401
    );
    for (const [port, paths] of [
      [3100, ["/manager", "/admin", "/workspace"]],
      [3101, ["/admin", "/search", "/account", "/workspace"]],
      [3102, ["/manager", "/search", "/account"]],
    ])
      for (const pathname of paths) {
        const r = await fetch(`http://localhost:${port}${pathname}`, {
          redirect: "manual",
        });
        assert.equal(r.status, 404, `${port}${pathname}`);
        assert.equal(r.headers.get("location"), null);
      }
    assert.equal((await api(3100, "GET", null, accounts.guest, "admin")).status, 404);
    assert.equal((await api(3101, "GET", null, accounts.owner, "admin")).status, 404);
    assert.equal((await api(3102, "POST", { action: "register-owner" })).status, 404);
    assert.equal(
      (
        await api(
          3101,
          "GET",
          null,
          "vabbot_owner_session=" + guest.cookie.split("=")[1],
          "mine"
        )
      ).status,
      401
    );
    const mine = (await api(3101, "GET", null, accounts.owner, "mine")).data;
    const org = mine.organisation.id;
    for (const kind of ["business_registration", "proof_of_address", "owner_id"]) {
      const f = new FormData();
      f.set("kind", kind);
      f.set(
        "file",
        new Blob(["%PDF-1.4 test document"], { type: "application/pdf" }),
        "test.pdf"
      );
      const r = await api(3101, "POST", f, accounts.owner);
      assert.equal(r.status, 201);
    }
    await ok(
      3102,
      { action: "verify-organisation", id: org, status: "approved" },
      accounts.admin
    );
    const property = (
      await ok(
        3101,
        { action: "create-property", name: "Test Lake House", type: "short_term_let" },
        accounts.owner
      )
    ).data.id;
    await ok(
      3101,
      {
        action: "update-property",
        id: property,
        description: "A test house for an isolated integration check.",
        address: "London, United Kingdom",
        latitude: 51.507,
        longitude: -0.128,
        photos: [
          "photo-1571896349842-33c89424de2d",
          "photo-1611892440504-42a792e24d32",
          "photo-1540541338287-41700207dee6",
          "photo-1449158743715-0a90ebb6d2d8",
          "photo-1566073771259-6a8506099945",
        ].map((p) => "/assets/" + p + ".jpg"),
        amenities: ["Wi-Fi", "Parking"],
        houseRules: "No smoking indoors.",
        cancellationPolicy: "Free cancellation before arrival.",
        checkIn: "14:00",
        checkOut: "10:00",
      },
      accounts.owner
    );
    const room = (
      await ok(
        3101,
        {
          action: "create-room",
          propertyId: property,
          name: "House",
          beds: "1 king bed",
          adults: 2,
          children: 0,
          units: 1,
          nightlyRate: 100000,
        },
        accounts.owner
      )
    ).data.id;
    await ok(3101, { action: "publish-property", id: property }, accounts.owner);
    await ok(
      3101,
      { action: "update-rate", roomId: room, nightlyRate: 120000 },
      accounts.owner
    );
    assert.equal(
      (
        await api(
          3101,
          "POST",
          { action: "update-rate", roomId: room, nightlyRate: 1 },
          accounts.other
        )
      ).status,
      404
    );
    assert.equal(
      (await api(3101, "GET", null, accounts.other, "mine")).data.properties.length,
      0
    );
    const catalogue = (await api(3100, "GET", null, accounts.guest, "search")).data
      .results;
    assert.equal(catalogue.length, 1);
    assert.equal(catalogue[0].rooms[0].nightly_rate_minor, 12000000);
    const start = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      end = new Date(Date.now() + 9 * 86400000).toISOString().slice(0, 10);
    const request = (
      await ok(
        3100,
        {
          action: "request-stay",
          propertyId: property,
          roomId: room,
          start,
          end,
          guests: 2,
          rooms: 1,
        },
        accounts.guest
      )
    ).data.id;
    assert.equal(
      (
        await api(
          3101,
          "POST",
          { action: "booking-status", id: request, status: "confirmed" },
          accounts.other
        )
      ).status,
      404
    );
    await ok(
      3101,
      { action: "booking-status", id: request, status: "confirmed" },
      accounts.owner
    );
    await ok(
      3101,
      { action: "booking-status", id: request, status: "checked_in" },
      accounts.owner
    );
    const bookedDates = await fetch(`http://localhost:3100/api/platform?view=search&checkIn=${start}&checkOut=${end}`);
    assert.equal((await bookedDates.json()).results.length, 0, 'Reserved rooms must disappear from matching date search');
    assert.equal((await fetch('http://localhost:3100/api/platform?view=search&checkIn=2026-02-30&checkOut=2026-03-03')).status, 400);
    const owned = (await api(3101, "GET", null, accounts.owner, "mine")).data;
    assert.equal(owned.bookings[0].guests, 2);
    assert.equal(owned.bookings[0].status, "checked_in");
    const global = (await api(3102, "GET", null, accounts.admin, "admin")).data;
    assert.equal(global.users.length, 4);
    assert.equal(global.properties.length, 1);
    assert.equal(global.bookings.length, 1);
    assert.ok(!JSON.stringify(global.users).includes("password_hash"));
    await ok(
      3102,
      { action: "platform-settings", acceptingRequests: false },
      accounts.admin
    );
    assert.equal(
      (
        await api(
          3100,
          "POST",
          {
            action: "request-stay",
            propertyId: property,
            roomId: room,
            start,
            end,
            guests: 2,
            rooms: 1,
          },
          accounts.guest
        )
      ).status,
      400
    );
    await ok(
      3102,
      { action: "platform-settings", acceptingRequests: true },
      accounts.admin
    );
    await ok(
      3102,
      { action: "user-status", id: owner.data.user.id, status: "suspended" },
      accounts.admin
    );
    assert.equal((await api(3101, "GET", null, accounts.owner, "mine")).status, 401);
    assert.equal((await api(3100, "GET", null, "", "search")).data.results.length, 0);
    await ok(
      3102,
      { action: "user-status", id: owner.data.user.id, status: "active" },
      accounts.admin
    );
    accounts.owner = (
      await ok(3101, { action: "login", email: "owner@vabbot.test", password })
    ).cookie;
    console.log(
      "PASS: accounts, portal isolation, ownership, verification, posting, pricing, guest requests, manager guest counts and super-admin controls"
    );
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    for (const cookie of [accounts.guest, accounts.owner, accounts.admin]) {
      const i = cookie.indexOf("=");
      await context.addCookies([
        {
          name: cookie.slice(0, i),
          value: cookie.slice(i + 1),
          domain: "localhost",
          path: "/",
          httpOnly: true,
          sameSite: "Lax",
        },
      ]);
    }
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const [port, name] of [
      [3100, "guest"],
      [3101, "manager"],
      [3102, "admin"],
    ]) {
      await page.goto(`http://localhost:${port}`, {
        waitUntil: "networkidle",
        timeout: 120000,
      });
      await page.locator("img").evaluateAll(async (imgs) => {
        imgs.forEach((i) => (i.loading = "eager"));
        await Promise.all(imgs.map((i) => i.decode().catch(() => {})));
      });
      if (port === 3100) {
        assert.equal(
          await page
            .getByRole("link", { name: "List your property", exact: false })
            .count(),
          0
        );
        await page.getByRole("heading", { name: "Test Lake House" }).waitFor();
      }
      if (port === 3101) {
        await page.getByText("My listings", { exact: true }).waitFor();
        assert.equal(await page.getByRole("link", { name: "Platform admin" }).count(), 0);
      }
      if (port === 3102)
        await page.getByRole("button", { name: "Managers", exact: true }).waitFor();
      assert.equal(
        await page
          .locator("a")
          .evaluateAll((links) =>
            links.some(
              (a) =>
                /^http/.test(a.href) &&
                new URL(a.href).port !== location.port &&
                new URL(a.href).hostname === "localhost"
            )
          ),
        false
      );
      await page.screenshot({
        path: path.join(report, `isolated-${name}-desktop.png`),
        fullPage: true,
      });
      await page.setViewportSize({ width: 390, height: 844 });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false
      );
      await page.screenshot({
        path: path.join(report, `isolated-${name}-mobile.png`),
        fullPage: true,
      });
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      path.join(report, "isolated-portals.json"),
      JSON.stringify(
        {
          passed: true,
          isolatedAccounts: true,
          roleRestrictedRoutes: true,
          ownerIsolation: true,
          realListingLifecycle: true,
          guestRequests: true,
          superAdminControls: true,
          mobileOverflow: false,
          errors,
        },
        null,
        2
      )
    );
    console.log(
      "PASS: all three portal UIs, no cross-portal links, desktop/mobile captures, no overflow or runtime errors"
    );
  } finally {
    if (browser) await browser.close();
    for (const child of children)
      if (child.pid) {
        try {
          execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
            stdio: "ignore",
            timeout: 10000,
          });
        } catch {}
      }
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
