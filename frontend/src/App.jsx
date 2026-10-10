import React, { useCallback, useEffect, useState } from 'react';
import { opportunitiesApi } from './api.js';

const emptyOpportunity = {
  title: '',
  description: '',
  research_area: '',
  faculty_name: '',
  department: '',
  required_skills: '',
  available_positions: '',
  application_deadline: '',
  status: 'Open',
};

const formFields = [
  ['title', 'Opportunity title'],
  ['research_area', 'Research area'],
  ['faculty_name', 'Faculty name'],
  ['department', 'Department'],
  ['required_skills', 'Required skills'],
];

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    Number(value.slice(0, 4)) >= 1000 &&
    !Number.isNaN(date.valueOf()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function displayDate(value) {
  if (!value) return 'Not specified';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.valueOf())
    ? String(value)
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(date);
}

function OpportunityForm({ initialValue, busy, onCancel, onSubmit }) {
  const [values, setValues] = useState(() => ({
    ...emptyOpportunity,
    ...initialValue,
    available_positions: initialValue?.available_positions ?? '',
    application_deadline: initialValue?.application_deadline
      ? String(initialValue.application_deadline).slice(0, 10)
      : '',
  }));
  const [validationError, setValidationError] = useState('');

  function updateField(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setValidationError('');

    for (const [name, label] of [
      ...formFields,
      ['description', 'Description'],
      ['available_positions', 'Available positions'],
      ['application_deadline', 'Application deadline'],
    ]) {
      if (!String(values[name] ?? '').trim()) {
        setValidationError(`${label} is required.`);
        return;
      }
    }

    const positions = Number(values.available_positions);
    if (!Number.isSafeInteger(positions) || positions <= 0) {
      setValidationError('Available positions must be a positive whole number.');
      return;
    }
    if (!isValidDate(values.application_deadline)) {
      setValidationError('Enter a valid application deadline.');
      return;
    }
    if (values.status !== 'Open' && values.status !== 'Closed') {
      setValidationError('Status must be Open or Closed.');
      return;
    }

    await onSubmit({
      ...values,
      available_positions: positions,
      application_deadline: values.application_deadline,
    });
  }

  return (
    <section className="panel form-panel" aria-labelledby="form-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{initialValue ? 'MAKE CHANGES' : 'NEW LISTING'}</p>
          <h2 id="form-heading">{initialValue ? 'Edit opportunity' : 'Post an opportunity'}</h2>
        </div>
        <button className="icon-button" type="button" onClick={onCancel} aria-label="Close form">
          ×
        </button>
      </div>

      <form className="opportunity-form" onSubmit={submit} noValidate>
        {formFields.slice(0, 1).map(([name, label]) => (
          <label className="field" key={name}>
            <span>{label} <span className="required">*</span></span>
            <input name={name} value={values[name]} onChange={updateField} maxLength={255} required />
          </label>
        ))}
        <label className="field">
          <span>Description <span className="required">*</span></span>
          <textarea name="description" value={values.description} onChange={updateField} rows="4" required />
        </label>
        <div className="form-grid">
          {formFields.slice(1).map(([name, label]) => (
            <label className="field" key={name}>
              <span>{label} <span className="required">*</span></span>
              <input name={name} value={values[name]} onChange={updateField} maxLength={255} required />
            </label>
          ))}
        </div>
        <div className="form-grid compact-grid">
          <label className="field">
            <span>Available positions <span className="required">*</span></span>
            <input
              name="available_positions"
              type="number"
              min="1"
              step="1"
              value={values.available_positions}
              onChange={updateField}
              required
            />
          </label>
          <label className="field">
            <span>Application deadline <span className="required">*</span></span>
            <input
              name="application_deadline"
              type="date"
              value={values.application_deadline}
              onChange={updateField}
              required
            />
          </label>
        </div>
        <label className="field">
          <span>Status <span className="required">*</span></span>
          <select name="status" value={values.status} onChange={updateField} required>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
        </label>

        {validationError && <p className="form-error" role="alert">{validationError}</p>}
        <div className="form-actions">
          <button className="button button-quiet" type="button" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className="button button-primary" type="submit" disabled={busy}>
            {busy ? 'Saving…' : initialValue ? 'Save changes' : 'Create opportunity'}
          </button>
        </div>
      </form>
    </section>
  );
}

function OpportunityDetails({ opportunity, busy, onEdit, onClose, onDelete }) {
  if (!opportunity) {
    return (
      <section className="panel details-placeholder">
        <span className="detail-mark" aria-hidden="true">✳</span>
        <h2>Opportunity details</h2>
        <p>Select an opportunity to see its full details and available actions.</p>
      </section>
    );
  }

  return (
    <section className="panel details-panel" aria-labelledby="details-heading">
      <div className="panel-heading">
        <p className="eyebrow">FULL DETAILS</p>
        <span className={`status-badge ${opportunity.status === 'Open' ? 'status-open' : 'status-closed'}`}>
          <span className="status-dot" />
          {opportunity.status}
        </span>
      </div>
      <h2 id="details-heading">{opportunity.title}</h2>
      <p className="detail-area">{opportunity.research_area}</p>
      <p className="detail-description">{opportunity.description}</p>
      <dl className="detail-list">
        <div><dt>Faculty</dt><dd>{opportunity.faculty_name}</dd></div>
        <div><dt>Department</dt><dd>{opportunity.department}</dd></div>
        <div><dt>Required skills</dt><dd>{opportunity.required_skills}</dd></div>
        <div><dt>Positions</dt><dd>{opportunity.available_positions}</dd></div>
        <div><dt>Apply by</dt><dd>{displayDate(opportunity.application_deadline)}</dd></div>
      </dl>
      <div className="details-actions">
        <button className="button button-primary" onClick={onEdit} disabled={busy}>Edit</button>
        {opportunity.status === 'Open' && (
          <button className="button button-quiet" onClick={onClose} disabled={busy}>
            Close opportunity
          </button>
        )}
        <button className="button button-danger" onClick={onDelete} disabled={busy}>Delete</button>
      </div>
    </section>
  );
}

function App() {
  const [opportunities, setOpportunities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [panel, setPanel] = useState('details');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refreshOpportunities = useCallback(async (selectedId = null) => {
    setLoading(true);
    let detailError = '';
    try {
      const results = await opportunitiesApi.list();
      if (!Array.isArray(results)) {
        throw new Error('The API returned an unexpected opportunities response.');
      }
      setOpportunities(results);
      const nextId = selectedId ?? selected?.id;
      if (nextId != null) {
        const refreshed = results.find((item) => String(item.id) === String(nextId));
        if (refreshed) {
          try {
            setSelected(await opportunitiesApi.get(refreshed.id));
          } catch (requestError) {
            setSelected(refreshed);
            detailError = requestError.message;
          }
        } else {
          setSelected(null);
        }
      }
      setError(detailError);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [selected?.id]);

  useEffect(() => {
    refreshOpportunities();
  }, [refreshOpportunities]);

  async function selectOpportunity(item) {
    setError('');
    setNotice('');
    setPanel('details');
    setSelected(item);
    try {
      setSelected(await opportunitiesApi.get(item.id));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function saveOpportunity(payload) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const saved = panel === 'edit'
        ? await opportunitiesApi.update(selected.id, payload)
        : await opportunitiesApi.create(payload);
      await refreshOpportunities(saved.id);
      setPanel('details');
      setNotice(panel === 'edit' ? 'Opportunity updated successfully.' : 'Opportunity created successfully.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function closeOpportunity() {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const closed = {
        ...selected,
        application_deadline: String(selected.application_deadline).slice(0, 10),
        status: 'Closed',
      };
      await opportunitiesApi.update(selected.id, closed);
      await refreshOpportunities(selected.id);
      setNotice('Opportunity marked as closed.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteOpportunity() {
    if (!window.confirm(`Delete "${selected.title}"? This cannot be undone.`)) return;

    setBusy(true);
    setError('');
    setNotice('');
    try {
      await opportunitiesApi.remove(selected.id);
      setSelected(null);
      setPanel('details');
      await refreshOpportunities();
      setNotice('Opportunity deleted successfully.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function openCreateForm() {
    setSelected(null);
    setPanel('create');
    setError('');
    setNotice('');
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Research Opportunity Portal home">
          <span className="brand-icon" aria-hidden="true">R</span>
          <span>Research<span className="brand-light"> Portal</span></span>
        </a>
        <span className="topbar-note">University research, within reach.</span>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">DISCOVER WHAT'S NEXT</p>
          <h1>Find your place<br />in the research.</h1>
          <p className="hero-subtitle">Explore projects, meet faculty, and turn your curiosity into meaningful work.</p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="orbit orbit-one" />
          <span className="orbit orbit-two" />
          <span className="art-spark">✳</span>
          <span className="art-label">Ideas grow here</span>
        </div>
      </section>

      <section className="workspace" aria-label="Research opportunities">
        <div className="list-column">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE OPPORTUNITIES</p>
              <h2>Explore research</h2>
            </div>
            <button className="button button-primary create-button" onClick={openCreateForm}>
              <span aria-hidden="true">＋</span> Post opportunity
            </button>
          </div>

          {error && <div className="message message-error" role="alert">{error}</div>}
          {notice && <div className="message message-success" role="status">{notice}</div>}

          {loading ? (
            <div className="loading-state" role="status"><span className="spinner" /> Loading opportunities…</div>
          ) : error && opportunities.length === 0 ? (
            <div className="empty-state">
              <h3>Opportunities couldn’t load</h3>
              <p>Check the backend connection, then try again.</p>
              <button className="button button-primary" onClick={() => refreshOpportunities()}>
                Try again
              </button>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon" aria-hidden="true">✳</span>
              <h3>No opportunities yet</h3>
              <p>When faculty share a project, it will show up here. You can also post the first opportunity.</p>
              <button className="button button-primary" onClick={openCreateForm}>Post the first opportunity</button>
            </div>
          ) : (
            <div className="opportunity-list">
              {opportunities.map((item) => (
                <button
                  type="button"
                  className={`opportunity-card ${selected?.id === item.id ? 'card-selected' : ''}`}
                  key={item.id}
                  onClick={() => selectOpportunity(item)}
                  aria-pressed={selected?.id === item.id}
                >
                  <div className="card-topline">
                    <span className="card-area">{item.research_area}</span>
                    <span className={`status-badge ${item.status === 'Open' ? 'status-open' : 'status-closed'}`}>
                      <span className="status-dot" />{item.status}
                    </span>
                  </div>
                  <h3>{item.title}</h3>
                  <p className="card-description">{item.description}</p>
                  <div className="card-footer">
                    <span>{item.faculty_name}</span>
                    <span>{item.available_positions} {Number(item.available_positions) === 1 ? 'position' : 'positions'}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="detail-column" aria-live="polite">
          {panel === 'create' || panel === 'edit' ? (
            <OpportunityForm
              key={`${panel}-${selected?.id ?? 'new'}`}
              initialValue={panel === 'edit' ? selected : null}
              busy={busy}
              onCancel={() => setPanel('details')}
              onSubmit={saveOpportunity}
            />
          ) : (
            <OpportunityDetails
              opportunity={selected}
              busy={busy}
              onEdit={() => { setPanel('edit'); setError(''); setNotice(''); }}
              onClose={closeOpportunity}
              onDelete={deleteOpportunity}
            />
          )}
        </aside>
      </section>

      <footer className="page-footer">
        <span>Research Opportunity Portal</span>
        <span>Curiosity is a good place to start.</span>
      </footer>
    </main>
  );
}

export default App;
