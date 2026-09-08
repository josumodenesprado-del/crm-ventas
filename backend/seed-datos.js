const db = require('./config/db');

// Verificar si ya hay leads
const leadCount = db.prepare('SELECT COUNT(*) as total FROM leads').get();
if (leadCount.total > 0) {
  console.log(`Ya hay ${leadCount.total} leads en la base de datos. Saltando.`);
  process.exit(0);
}

console.log('Poblando base de datos con datos de ejemplo...');

// Usuarios vendedores
const insertUsuario = db.prepare(`
  INSERT OR IGNORE INTO usuarios (username, nombre, email, password, rol)
  VALUES (?, ?, ?, ?, 'vendedor')
`);

const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const passHash = bcrypt.hashSync('Vendedor123!', salt);

const vendedores = [
  { username: 'carolina', nombre: 'Carolina Méndez', email: 'carolina@velixai.com' },
  { username: 'pedro', nombre: 'Pedro Sánchez', email: 'pedro@velixai.com' },
  { username: 'lucia', nombre: 'Lucía Torres', email: 'lucia@velixai.com' },
];

for (const v of vendedores) {
  insertUsuario.run(v.username, v.nombre, v.email, passHash);
}

// Obtener IDs de usuarios
const carolina = db.prepare("SELECT id FROM usuarios WHERE username = 'carolina'").get();
const pedro = db.prepare("SELECT id FROM usuarios WHERE username = 'pedro'").get();
const lucia = db.prepare("SELECT id FROM usuarios WHERE username = 'lucia'").get();

// Leads de clínicas dentales
const insertLead = db.prepare(`
  INSERT INTO leads (nombre, empresa, telefono, email, estado, notas, asignado_a, fecha_seguimiento, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const now = new Date().toISOString();
const hace3dias = new Date(Date.now() - 3*24*60*60*1000).toISOString();
const hace5dias = new Date(Date.now() - 5*24*60*60*1000).toISOString();
const hace1semana = new Date(Date.now() - 7*24*60*60*1000).toISOString();
const hace2semanas = new Date(Date.now() - 14*24*60*60*1000).toISOString();
const hace1mes = new Date(Date.now() - 30*24*60*60*1000).toISOString();
const manana = new Date(Date.now() + 1*24*60*60*1000).toISOString();
const en3dias = new Date(Date.now() + 3*24*60*60*1000).toISOString();
const en1semana = new Date(Date.now() + 7*24*60*60*1000).toISOString();

const leads = [
  {
    nombre: 'Dr. Martín López',
    empresa: 'Clínica Dental Sonrisa',
    telefono: '622 345 678',
    email: 'info@sonrisadental.es',
    estado: 'cerrado_ganado',
    notas: 'Ya tienen VelixAI instalado. Paquete Premium 12 meses. Facturación: 4.800€/año.',
    asignado_a: carolina.id,
    fecha_seguimiento: null,
    created_at: hace2semanas,
    updated_at: hace3dias
  },
  {
    nombre: 'Dra. Ana García',
    empresa: 'Dentalia Centro',
    telefono: '644 789 012',
    email: 'ana@dentaliacentro.com',
    estado: 'propuesta_enviada',
    notas: 'Interesada en automatización de WhatsApp. Le envié propuesta el lunes. Esperando respuesta.',
    asignado_a: carolina.id,
    fecha_seguimiento: manana,
    created_at: hace5dias,
    updated_at: hace1semana
  },
  {
    nombre: 'Dr. Carlos Ruiz',
    empresa: 'Ruiz Odontología',
    telefono: '611 234 567',
    email: 'contacto@ruizodonto.es',
    estado: 'interesado',
    notas: 'Quiere ver demo en vivo. Clínica grande (6 sillas). Precio es sensible. Pide descuento por volumen.',
    asignado_a: carolina.id,
    fecha_seguimiento: en3dias,
    created_at: hace1semana,
    updated_at: hace5dias
  },
  {
    nombre: 'Dra. Patricia Vega',
    empresa: 'Vega Dental Group',
    telefono: '655 890 123',
    email: 'pvega@vegadental.es',
    estado: 'contactado',
    notas: 'Primer contacto por email. Preguntó por integración con su sistema de citas actual (Tactus).',
    asignado_a: pedro.id,
    fecha_seguimiento: en1semana,
    created_at: hace1semana,
    updated_at: hace1semana
  },
  {
    nombre: 'Dr. Javier Moreno',
    empresa: 'Clínica DentPerfect',
    telefono: '633 456 789',
    email: 'jmoreno@dentperfect.com',
    estado: 'sin_contactar',
    notas: 'Lead de LinkedIn. Director de 3 clínicas en Madrid. Alto potencial.',
    asignado_a: carolina.id,
    fecha_seguimiento: en3dias,
    created_at: hace3dias,
    updated_at: hace3dias
  },
  {
    nombre: 'Dra. María José Alonso',
    empresa: 'Alonso & Asociados',
    telefono: '677 012 345',
    email: 'mjalonso@alonsoydental.es',
    estado: 'cerrado_perdido',
    notas: 'Decidió ir con otra solución (DentalChat). Presupuesto era el problema. Mantener contacto.',
    asignado_a: pedro.id,
    fecha_seguimiento: null,
    created_at: hace1mes,
    updated_at: hace2semanas
  },
  {
    nombre: 'Dr. Roberto Díaz',
    empresa: 'Dental 360',
    telefono: '688 567 890',
    email: 'r diaz@dental360madrid.com',
    estado: 'interesado',
    notas: 'Viene de recomendación de Dr. López (Sonrisa). Muy interesado en IA para revisiones.',
    asignado_a: lucia.id,
    fecha_seguimiento: manana,
    created_at: hace5dias,
    updated_at: hace5dias
  },
  {
    nombre: 'Dra. Elena Castillo',
    empresa: 'Castillo Odontología',
    telefono: '699 123 456',
    email: 'elena@castillodental.es',
    estado: 'propuesta_enviada',
    notas: 'Propuesta enviada hace 2 días. Clínica familiar pequeña (2 sillas). Buscan algo sencillo.',
    asignado_a: lucia.id,
    fecha_seguimiento: en1semana,
    created_at: hace5dias,
    updated_at: hace3dias
  },
  {
    nombre: 'Dr. Fernando Gutiérrez',
    empresa: 'Gutiérrez Dental Clinic',
    telefono: '610 678 901',
    email: 'info@gutierrezclinic.es',
    estado: 'contactado',
    notas: 'Habló con su asistente. El doctor está de vacaciones hasta el lunes. Llamar entonces.',
    asignado_a: carolina.id,
    fecha_seguimiento: en1semana,
    created_at: hace3dias,
    updated_at: hace3dias
  },
  {
    nombre: 'Dra. Laura Navarro',
    empresa: 'Navarro Dental Care',
    telefono: '621 890 123',
    email: 'laura@navarrocare.com',
    estado: 'sin_contactar',
    notas: 'Inscripción en webinar de VelixAI. Descargó el ebook "IA en Odontología".',
    asignado_a: pedro.id,
    fecha_seguimiento: manana,
    created_at: hoy(),
    updated_at: hoy()
  }
];

function hoy() {
  return new Date().toISOString();
}

for (const l of leads) {
  insertLead.run(
    l.nombre, l.empresa, l.telefono, l.email,
    l.estado, l.notas, l.asignado_a, l.fecha_seguimiento,
    l.created_at, l.updated_at
  );
}

// Actividades
const insertActividad = db.prepare(`
  INSERT INTO actividades (lead_id, usuario_id, accion, descripcion, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

const actividades = [
  { lead_id: 1, usuario_id: carolina.id, accion: 'llamada', descripcion: 'Primera llamada. Interesado en paquete Premium.', created_at: hace2semanas },
  { lead_id: 1, usuario_id: carolina.id, accion: 'email', descripcion: 'Enviada propuesta comercial.', created_at: hace1semana },
  { lead_id: 1, usuario_id: carolina.id, accion: 'reunion', descripcion: 'Reunión online. Aceptó propuesta.', created_at: hace3dias },
  { lead_id: 1, usuario_id: carolina.id, accion: 'contrato', descripcion: 'Firmado contrato 12 meses Premium.', created_at: hace3dias },

  { lead_id: 2, usuario_id: carolina.id, accion: 'llamada', descripcion: 'Llamada inicial. Interesada en WhatsApp.', created_at: hace5dias },
  { lead_id: 2, usuario_id: carolina.id, accion: 'email', descripcion: 'Enviada propuesta detallada.', created_at: hace1semana },
  { lead_id: 2, usuario_id: carolina.id, accion: 'seguimiento', descripcion: 'Pendiente de respuesta.', created_at: hoy() },

  { lead_id: 3, usuario_id: carolina.id, accion: 'reunion', descripcion: 'Demo online. Le gustó la parte de IA.', created_at: hace5dias },
  { lead_id: 3, usuario_id: carolina.id, accion: 'llamada', descripcion: 'Seguimiento. Negociando precio.', created_at: hace3dias },

  { lead_id: 4, usuario_id: pedro.id, accion: 'email', descripcion: 'Primer contacto. Info general.', created_at: hace1semana },

  { lead_id: 5, usuario_id: carolina.id, accion: 'linkedin', descripcion: 'Mensaje por LinkedIn. Alto potencial.', created_at: hace3dias },

  { lead_id: 6, usuario_id: pedro.id, accion: 'reunion', descripcion: 'Demo. Decidió ir con DentalChat.', created_at: hace2semanas },
  { lead_id: 6, usuario_id: pedro.id, accion: 'email', descripcion: 'Email de despedida. Mantener relación.', created_at: hace2semanas },

  { lead_id: 7, usuario_id: lucia.id, accion: 'llamada', descripcion: 'Recomendado por Dr. López.', created_at: hace5dias },
  { lead_id: 7, usuario_id: lucia.id, accion: 'email', descripcion: 'Enviada info detallada.', created_at: hace5dias },

  { lead_id: 8, usuario_id: lucia.id, accion: 'email', descripcion: 'Propuesta enviada.', created_at: hace3dias },

  { lead_id: 9, usuario_id: carolina.id, accion: 'llamada', descripcion: 'Habló con asistente. Llamar el lunes.', created_at: hace3dias },

  { lead_id: 10, usuario_id: pedro.id, accion: 'webinar', descripcion: 'Inscrito en webinar automático.', created_at: hoy() },
];

for (const a of actividades) {
  insertActividad.run(a.lead_id, a.usuario_id, a.accion, a.descripcion, a.created_at);
}

console.log(`✅ Datos creados:`);
console.log(`   - ${vendedores.length} vendedores`);
console.log(`   - ${leads.length} leads de clínicas dentales`);
console.log(`   - ${actividades.length} actividades`);
console.log(`\nCredenciales de acceso:`);
console.log(`   Admin: admin@clinica.com / Admin123!`);
console.log(`   Carolina: carolina@velixai.com / Vendedor123!`);
