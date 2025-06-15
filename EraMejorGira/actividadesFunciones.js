const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTUsBbnFj5HlAxFGG3EprYN-t9b1zJKdRJCeJn1J5RszJAsCGBkkUm7oH-fKFcxKhadzluF0VzTiyPX/pub?output=csv&gid=0';

function parseCSV(text) {
  const [headerLine, ...rows] = text.trim().split('\n');
  const keys = headerLine.split(',').map(k => k.trim());
  return rows.map(row => {
    const values = row.split(',');
    const obj = {};
    keys.forEach((key, i) => {
      obj[key] = values[i] ? values[i].trim() : '';
    });
    return obj;
  });
}

function isActive(evento) {
  return evento.Activo === '1';
}

function isUpcoming(evento) {
  const now = new Date();
  const end = evento.Fecha_fin ? new Date(evento.Fecha_fin) : new Date(evento.Fecha_inicio);
  return end >= now;
}

async function cargarEventos() {
  const container = document.getElementById('eventos');
  container.textContent = 'Cargando eventos...';
  try {
    const response = await fetch(sheetUrl);
    if (!response.ok) throw new Error('No se pudo cargar los datos');
    const text = await response.text();
    const eventos = parseCSV(text).filter(isActive).filter(isUpcoming);
    if (eventos.length === 0) {
      container.innerHTML = `
        <div class="no-eventos">
          <h3>Próximamente más actividades</h3>
          <p>Actualmente no hay eventos activos o próximos programados.</p>
          <p>Vuelve pronto para enterarte de nuevas actividades en la biblioteca.</p>
        </div>
      `;
  return;
}
    container.innerHTML = '';
    eventos.forEach((evento, idx) => {
      const imgSrc = evento.Imagen || 'https://via.placeholder.com/280x420?text=Sin+Imagen';
      const card = document.createElement('div');
      card.className = 'evento';
      card.dataset.idx = idx;
      card.innerHTML = `
        <div class="img-container"><img src="${imgSrc}" alt="${evento.Título}"></div>
        <div class="info">
          <div class="titulo">${evento.Título}</div>
          <div class="descripcion">${evento.Descripción}</div>
          <div class="fecha">Inicio: ${evento.Fecha_inicio} <br> Fin: ${evento.Fecha_fin || '–'}</div>
          <button class="btn-mas">Ver más</button>
        </div>`;
      container.appendChild(card);
    });
    setupModal(eventos);
  } catch (error) {
    container.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

function setupModal(eventos) {
  const modal = document.getElementById('modal');
  const closeBtn = modal.querySelector('.modal-close');
  const titleEl = modal.querySelector('#modalTitle');
  const datesEl = modal.querySelector('#modalDates');
  const placeEl = modal.querySelector('#modalPlace');
  const modeEl = modal.querySelector('#modalMode');
  const reqsEl = modal.querySelector('#modalReqs');
  const groupsEl = modal.querySelector('#modalGroups');
  const formEl = modal.querySelector('#modalForm');

  document.body.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-mas')) {
      const idx = e.target.closest('.evento').dataset.idx;
      const ev = eventos[idx];
      titleEl.textContent = ev.Título;
      datesEl.textContent = `Inicio: ${ev.Fecha_inicio} • Fin: ${ev.Fecha_fin || '–'}`;
      placeEl.textContent = ev.Lugar || '–';
      modeEl.textContent = ev.Modalidad || '–';
      reqsEl.innerHTML = ev.Requisitos
        ? ev.Requisitos.split(';').map(r => `<li>${r.trim()}</li>`).join('')
        : '<li>–</li>';
      groupsEl.innerHTML = ev.Grupos
        ? ev.Grupos.split(';').map(g => `<li>${g.trim()}</li>`).join('')
        : '<li>–</li>';
      formEl.href = ev.Form || '#';
      modal.classList.add('active');
    }
    if (e.target === closeBtn || e.target === modal) {
      modal.classList.remove('active');
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') modal.classList.remove('active');
  });
}

window.addEventListener('load', cargarEventos);
