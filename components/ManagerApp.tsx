'use client';

import { useCallback, useEffect, useState } from 'react';
import { Building2, CalendarDays, FileCheck2, Plus, RefreshCw } from 'lucide-react';

type RecordObject = Record<string, any>;
type ManagerState = { user: RecordObject; organisation: RecordObject; properties: RecordObject[]; rooms: RecordObject[]; documents: RecordObject[]; enquiries: RecordObject[]; bookings: RecordObject[] };

async function send(payload: RecordObject | FormData) {
  const response = await fetch('/api/platform', { method: 'POST', headers: payload instanceof FormData ? undefined : { 'Content-Type': 'application/json' }, body: payload instanceof FormData ? payload : JSON.stringify(payload) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'The request could not be completed.');
  return result;
}

export function ManagerApp() {
  const [state, setState] = useState<ManagerState | null>(null);
  const [session, setSession] = useState<RecordObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'register' | 'login'>('login');
  const [tab, setTab] = useState<'overview' | 'properties' | 'calendar' | 'inbox' | 'guests'>('overview');
  const [selected, setSelected] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const sessionResponse = await fetch('/api/platform?view=session', { cache: 'no-store' });
    const sessionData = await sessionResponse.json();
    setSession(sessionData.user);
    if (sessionData.user?.role === 'owner') {
      const response = await fetch('/api/platform?view=mine', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setState(data);
        setSelected((current) => current || data.properties[0]?.id || '');
      }
    } else setState(null);
    setLoading(false);
  }, []);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('mode') === 'register') setMode('register');
    void load();
  }, [load]);

  async function act(payload: RecordObject | FormData, success: string) {
    setBusy(true); setMessage(''); setError('');
    try { await send(payload); setMessage(success); await load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  function formValues(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    return Object.fromEntries(form.entries());
  }
  const property = state?.properties.find((item) => item.id === selected);
  const propertyRooms = state?.rooms.filter((room) => room.property_id === selected) || [];

  if (loading) return <div className="card" role="status">Loading your workspace…</div>;
  if (!session) return (
    <div className="grid-2" style={{ paddingBottom: 90, alignItems: 'start' }}>
      <div className="card">
        <div className="tabs"><button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Register an organisation</button><button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button></div>
        {mode === 'register' ? (
          <form onSubmit={(event) => { const values = formValues(event); void act({ action: 'register-owner', ...values }, 'Organisation created. Upload documents to start verification.'); }}>
            <div className="form-grid">
              <label className="field">Your name<input name="name" required /></label>
              <label className="field">Email<input name="email" type="email" required /></label>
              <label className="field">Phone<input name="phone" type="tel" required /></label>
              <label className="field">Password (12+ characters)<input name="password" type="password" minLength={12} required /></label>
              <label className="field">Organisation name<input name="organisationName" required /></label>
              <label className="field">Organisation type<select name="organisationType"><option value="hotel">Hotel</option><option value="lodge">Lodge</option><option value="guesthouse">Guesthouse</option><option value="short_term_let">Short-term let</option></select></label>
              <label className="field">Business registration number<input name="registrationNumber" required /></label>
              <label className="field">Accommodation licence (if applicable)<input name="licenceNumber" /></label>
              <label className="field full">Business address<input name="address" required /></label>
            </div>
            <div className="form-actions"><button className="button" disabled={busy}>Create organisation</button></div>
          </form>
        ) : (
          <form onSubmit={(event) => { const values = formValues(event); void act({ action: 'login', ...values }, 'Signed in.'); }}>
            <div className="form-grid"><label className="field full">Email<input name="email" type="email" required /></label><label className="field full">Password<input name="password" type="password" required /></label></div>
            <div className="form-actions"><button className="button" disabled={busy}>Sign in</button></div>
          </form>
        )}
        {error && <p role="alert" className="status error" style={{ marginTop: 18 }}>{error}</p>}
        {message && <p role="status" className="status" style={{ marginTop: 18 }}>{message}</p>}
      </div>
      <aside className="stack">
        <div className="card"><div className="card-icon"><Building2 size={24} /></div><h3>One account, multiple properties</h3><p>Enter organisation details once, then prepare each hotel, lodge, guesthouse or short-term let separately.</p></div>
        <div className="card"><div className="card-icon"><FileCheck2 size={24} /></div><h3>Verification before publication</h3><p>Business registration, proof of address and owner ID are reviewed by an administrator. Guest listings stay hidden until all publication checks pass.</p></div>
      </aside>
    </div>
  );
  if (session.role !== 'owner') return <div className="notice" style={{ marginBottom: 80 }}>This workspace is for hotel managers only.</div>;

  return <div style={{ paddingBottom: 90 }}>
    <div className="toolbar"><div><strong>{state?.organisation?.name}</strong><span style={{ marginLeft: 10 }} className={state?.organisation?.status === 'approved' ? 'badge' : 'badge warn'}>{state?.organisation?.status?.replace('_', ' ')}</span></div><button className="button ghost small" onClick={() => void act({ action: 'logout' }, 'Signed out.')} disabled={busy}>Sign out</button></div>
    <div className="notice">Your organisation needs administrator approval before publishing. Stay requests collect no online payment. You can only manage properties belonging to your organisation.</div>
    <div className="metric-grid">
      <div className="metric"><span>My listings</span><strong>{state?.properties.length||0}</strong><small>All your hotels and houses</small></div>
      <div className="metric"><span>Published listings</span><strong>{state?.properties.filter(p=>p.status==='published').length||0}</strong><small>Visible to guests</small></div>
      <div className="metric"><span>Current guests</span><strong>{state?.bookings?.filter(b=>b.status==='checked_in').reduce((n,b)=>n+b.guests,0)||0}</strong><small>Guests checked in</small></div>
      <div className="metric"><span>Pending requests</span><strong>{state?.bookings?.filter(b=>b.status==='pending').length||0}</strong><small>Waiting for your response</small></div>
    </div>
    <div className="tabs" role="tablist" aria-label="Property manager sections">
      {(['overview','properties','guests','calendar','inbox'] as const).map((item) => <button key={item} role="tab" aria-selected={tab === item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item === 'calendar' ? 'Availability' : item[0].toUpperCase() + item.slice(1)}</button>)}
    </div>
    {error && <p role="alert" className="status error">{error}</p>}
    {message && <p role="status" className="status">{message}</p>}

    {tab === 'overview' && <div className="grid-2">
      <div className="card">
        <h2>Verification documents</h2>
        <p>Upload PDF, JPEG or PNG files up to 5 MB. They are available to platform administrators only.</p>
        <form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void act(data, 'Document uploaded.'); event.currentTarget.reset(); }}>
          <div className="form-grid"><label className="field">Document type<select name="kind"><option value="business_registration">Business registration</option><option value="proof_of_address">Proof of address</option><option value="owner_id">Owner ID</option><option value="accommodation_licence">Accommodation licence</option></select></label><label className="field">Choose file<input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png" required /></label></div>
          <div className="form-actions"><button className="button" disabled={busy}>Upload document</button></div>
        </form>
        <ul>{state?.documents.map((document) => <li key={document.id}>{document.kind.replaceAll('_', ' ')} · {document.filename}</li>)}</ul>
      </div>
      <div className="card"><h2>Organisation status</h2><p>Current decision: <strong>{state?.organisation?.status?.replaceAll('_', ' ')}</strong></p>{state?.organisation?.verification_reason && <p>Admin note: {state.organisation.verification_reason}</p>}<p>Payout onboarding: <strong>{state?.organisation?.payout_status?.replaceAll('_', ' ')}</strong></p><p>Provider onboarding will be connected after the licensed Malawi payment partner is selected.</p></div>
    </div>}

    {tab === 'guests' && <div className="table-wrap"><table><thead><tr><th>Guest</th><th>Property</th><th>Dates</th><th>Guests</th><th>Status</th><th>Actions</th></tr></thead><tbody>{state?.bookings?.map(b=><tr key={b.id}><td>{b.guest_name}<small className="block muted">{b.guest_email||'Contact hidden until confirmation'}</small></td><td>{b.property_name}<small className="block muted">{b.room_name}</small></td><td>{b.check_in} to {b.check_out}</td><td>{b.guests}</td><td>{b.status.replaceAll('_',' ')}</td><td>{(b.status==='pending'?['confirmed','declined']:b.status==='confirmed'?['checked_in','cancelled']:b.status==='checked_in'?['completed']:[]).map(status=><button key={status} className="button small secondary" disabled={busy} onClick={()=>void act({action:'booking-status',id:b.id,status},'Stay request updated.')}>{status==='confirmed'?'Accept':status==='declined'?'Decline':status==='checked_in'?'Check in':status==='completed'?'Check out':'Cancel'}</button>)}</td></tr>)}</tbody></table>{!state?.bookings?.length&&<p className="empty-state">No guest requests for your properties yet.</p>}</div>}
    {tab === 'properties' && <div className="stack">
      <div className="card"><h2>Add a property draft</h2><form onSubmit={(event) => { const values = formValues(event); void act({ action: 'create-property', ...values }, 'Property draft created.'); event.currentTarget.reset(); }}><div className="form-grid"><label className="field">Property name<input name="name" required /></label><label className="field">Type<select name="type"><option value="hotel">Hotel</option><option value="lodge">Lodge</option><option value="guesthouse">Guesthouse</option><option value="short_term_let">Short-term let</option></select></label></div><div className="form-actions"><button className="button" disabled={busy}><Plus size={16} /> Add property</button></div></form></div>
      {state?.properties.length ? <div className="card"><div className="toolbar"><h2 style={{ margin: 0 }}>Property details</h2><select aria-label="Select property" value={selected} onChange={(event) => setSelected(event.target.value)}>{state.properties.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></div>
        {property && <><p><span className="badge warn">{property.status}</span> · A pin, five photos, rules, policy and a room are required before publication.</p>
          <form key={property.id} onSubmit={(event) => { const values = formValues(event); void act({ action: 'update-property', id: property.id, ...values, photos: String(values.photos).split('\n').map((value) => value.trim()).filter(Boolean), amenities: String(values.amenities).split(',').map((value) => value.trim()).filter(Boolean) }, 'Property details saved.'); }}>
            <div className="form-grid">
              <label className="field full">Description<textarea name="description" defaultValue={property.description} required /></label>
              <label className="field full">Address<input name="address" defaultValue={property.address} required /></label>
              <label className="field">Latitude<input name="latitude" type="number" step="any" min="-90" max="90" defaultValue={property.latitude ?? ''} required /></label>
              <label className="field">Longitude<input name="longitude" type="number" step="any" min="-180" max="180" defaultValue={property.longitude ?? ''} required /></label>
              <label className="field full">Photo URLs (one HTTPS URL per line, minimum five to publish)<textarea name="photos" defaultValue={JSON.parse(property.photos).join('\n')} /></label>
              <label className="field full">Amenities (comma separated)<input name="amenities" defaultValue={JSON.parse(property.amenities).join(', ')} /></label>
              <label className="field">Accessibility features<input name="accessibility" defaultValue={property.accessibility} /></label>
              <label className="field">Languages spoken<input name="languages" defaultValue={property.languages} /></label>
              <label className="field">Check-in time<input name="checkIn" type="time" defaultValue={property.check_in} /></label>
              <label className="field">Check-out time<input name="checkOut" type="time" defaultValue={property.check_out} /></label>
              <label className="field">Booking mode<select name="bookingMode" defaultValue={property.booking_mode}><option value="request">Request to book</option><option value="instant">Instant booking</option></select></label>
              <label className="field full">House rules<textarea name="houseRules" defaultValue={property.house_rules} required /></label>
              <label className="field full">Cancellation policy<textarea name="cancellationPolicy" defaultValue={property.cancellation_policy} required /></label>
            </div><div className="form-actions"><button className="button" disabled={busy}>Save property</button><button type="button" className="button secondary" disabled={busy} onClick={() => void act({ action: 'publish-property', id: property.id }, 'Property published.')}>Publish when ready</button><button type="button" className="button secondary" disabled={busy} onClick={()=>void act({action:'property-status',id:property.id,status:'paused'},'Listing paused.')}>Pause listing</button><button type="button" className="button ghost" disabled={busy} onClick={()=>void act({action:'property-status',id:property.id,status:'draft'},'Listing returned to draft.')}>Return to draft</button></div>
          </form>
          <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '32px 0' }} />
          <h3>Room types</h3>
          {propertyRooms.length > 0 && <div className="table-wrap" style={{ marginBottom: 25 }}><table><thead><tr><th>Room</th><th>Capacity</th><th>Units</th><th>Base rate</th></tr></thead><tbody>{propertyRooms.map((room) => <tr key={room.id}><td>{room.name}</td><td>{room.adult_capacity} adults, {room.child_capacity} children</td><td>{room.units}</td><td><form onSubmit={event=>{const values=formValues(event);void act({action:'update-rate',roomId:room.id,...values},'Room price updated.');}}><label className="field">Nightly rate (MWK)<input aria-label={'Price for '+room.name} name="nightlyRate" type="number" min="1" step="0.01" defaultValue={room.nightly_rate_minor/100} required/></label><button className="button small" disabled={busy}>Save price</button></form></td></tr>)}</tbody></table></div>}
          <form onSubmit={(event) => { const values = formValues(event); void act({ action: 'create-room', propertyId: property.id, ...values }, 'Room type added.'); event.currentTarget.reset(); }}><div className="form-grid"><label className="field">Room name<input name="name" required /></label><label className="field">Beds<input name="beds" placeholder="1 queen + 2 single" required /></label><label className="field">Adults<input name="adults" type="number" min="1" defaultValue="2" required /></label><label className="field">Children<input name="children" type="number" min="0" defaultValue="0" /></label><label className="field">Number of identical units<input name="units" type="number" min="1" defaultValue="1" required /></label><label className="field">Base nightly rate (MWK)<input name="nightlyRate" type="number" min="1" step="0.01" required /></label><label className="field">Size (m²)<input name="sizeSqm" type="number" min="0" step="0.1" /></label></div><div className="form-actions"><button className="button" disabled={busy}>Add room type</button></div></form>
        </>}
      </div> : <div className="card"><p>No properties yet. Add your first draft above.</p></div>}
    </div>}

    {tab === 'calendar' && <div className="card"><div className="card-icon"><CalendarDays size={24} /></div><h2>Update availability by date range</h2><p>Choose a room, dates and open units. This updates the whole range in one action and records the change in the audit log.</p>{state?.rooms.length ? <form onSubmit={(event) => { const values = formValues(event); void act({ action: 'set-availability', ...values }, 'Availability updated for the selected nights.'); }}><div className="form-grid"><label className="field full">Room type<select name="roomId">{state.rooms.map((room) => <option value={room.id} key={room.id}>{state.properties.find((item) => item.id === room.property_id)?.name} · {room.name} (max {room.units})</option>)}</select></label><label className="field">From<input name="start" type="date" required /></label><label className="field">Through<input name="end" type="date" required /></label><label className="field">Units open<input name="unitsOpen" type="number" min="0" defaultValue="0" required /></label><label className="field">Close dates<select name="closed"><option value="">No</option><option value="true">Yes</option></select></label></div><div className="form-actions"><button className="button" disabled={busy}><RefreshCw size={16} /> Apply to range</button></div></form> : <p>Add a property and room type first.</p>}</div>}

    {tab === 'inbox' && <div className="card"><h2>Enquiries and bookings</h2><p>Messages and booking states will appear here. Booking requests are held back until transactional inventory locks and payment webhooks are connected.</p>{state?.enquiries.length ? <div className="table-wrap"><table><thead><tr><th>Property</th><th>Guest</th><th>Message</th><th>Received</th></tr></thead><tbody>{state.enquiries.map((item) => <tr key={item.id}><td>{item.property_name}</td><td>{item.guest_name}</td><td>{item.message}</td><td>{item.created_at}</td></tr>)}</tbody></table></div> : <div className="notice">No enquiries yet.</div>}</div>}
  </div>;
}
