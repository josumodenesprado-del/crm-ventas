const express = require('express');
const pool = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    let query;
    let params;

    if (req.usuario.rol === 'admin') {
      query = `
        SELECT l.*, u.nombre as vendedor_nombre 
        FROM leads l 
        LEFT JOIN usuarios u ON l.asignado_a = u.id 
        ORDER BY l.updated_at DESC
      `;
      params = [];
    } else {
      query = `
        SELECT l.*, u.nombre as vendedor_nombre 
        FROM leads l 
        LEFT JOIN usuarios u ON l.asignado_a = u.id 
        WHERE l.asignado_a = $1 
        ORDER BY l.updated_at DESC
      `;
      params = [req.usuario.id];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    let query;
    let params;

    if (req.usuario.rol === 'admin') {
      query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN estado = 'sin_contactar' THEN 1 END) as sin_contactar,
          COUNT(CASE WHEN estado = 'contactado' THEN 1 END) as contactado,
          COUNT(CASE WHEN estado = 'interesado' THEN 1 END) as interesado,
          COUNT(CASE WHEN estado = 'propuesta_enviada' THEN 1 END) as propuesta_enviada,
          COUNT(CASE WHEN estado = 'cerrado_ganado' THEN 1 END) as cerrado_ganado,
          COUNT(CASE WHEN estado = 'cerrado_perdido' THEN 1 END) as cerrado_perdido
        FROM leads
      `;
      params = [];
    } else {
      query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN estado = 'sin_contactar' THEN 1 END) as sin_contactar,
          COUNT(CASE WHEN estado = 'contactado' THEN 1 END) as contactado,
          COUNT(CASE WHEN estado = 'interesado' THEN 1 END) as interesado,
          COUNT(CASE WHEN estado = 'propuesta_enviada' THEN 1 END) as propuesta_enviada,
          COUNT(CASE WHEN estado = 'cerrado_ganado' THEN 1 END) as cerrado_ganado,
          COUNT(CASE WHEN estado = 'cerrado_perdido' THEN 1 END) as cerrado_perdido
        FROM leads
        WHERE asignado_a = $1
      `;
      params = [req.usuario.id];
    }

    const result = await pool.query(query, params);

    let vendorStats = [];
    if (req.usuario.rol === 'admin') {
      const vendorResult = await pool.query(`
        SELECT 
          u.id,
          u.nombre,
          COUNT(l.id) as total_leads,
          COUNT(CASE WHEN l.estado = 'cerrado_ganado' THEN 1 END) as ganados
        FROM usuarios u
        LEFT JOIN leads l ON u.id = l.asignado_a
        WHERE u.rol = 'vendedor' AND u.activo = true
        GROUP BY u.id, u.nombre
        ORDER BY total_leads DESC
      `);
      vendorStats = vendorResult.rows;
    }

    res.json({
      pipeline: result.rows[0],
      vendedores: vendorStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { nombre, empresa, telefono, email, estado, notas, asignado_a, fecha_seguimiento, categoria, ciudad, provincia, direccion } = req.body;

    const vendedorId = req.usuario.rol === 'admin' ? (asignado_a || req.usuario.id) : req.usuario.id;
    const cat = ['web', 'clinica'].includes(categoria) ? categoria : 'web';

    const result = await pool.query(
      `INSERT INTO leads (nombre, empresa, telefono, email, estado, notas, asignado_a, categoria, ciudad, provincia, direccion, fecha_seguimiento)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [nombre, empresa, telefono, email, estado || 'sin_contactar', notas, vendedorId, cat, ciudad || null, provincia || null, direccion || null, fecha_seguimiento || null]
    );

    await pool.query(
      'INSERT INTO actividades (lead_id, usuario_id, accion, descripcion) VALUES ($1, $2, $3, $4)',
      [result.rows[0].id, req.usuario.id, 'creado', 'Lead creado']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, empresa, telefono, email, estado, notas, asignado_a, fecha_seguimiento, categoria, ciudad, provincia, direccion } = req.body;

    let lead;
    if (req.usuario.rol === 'admin') {
      lead = await pool.query('SELECT * FROM leads WHERE id = $1', [id]);
    } else {
      lead = await pool.query('SELECT * FROM leads WHERE id = $1 AND asignado_a = $2', [id, req.usuario.id]);
    }

    if (lead.rows.length === 0) {
      return res.status(404).json({ error: 'Lead no encontrado o sin acceso' });
    }

    const oldEstado = lead.rows[0].estado;

    const cat = categoria === undefined || categoria === null ? null : (['web', 'clinica'].includes(categoria) ? categoria : null);

    const result = await pool.query(
      `UPDATE leads
       SET nombre = COALESCE($1, nombre),
           empresa = COALESCE($2, empresa),
           telefono = COALESCE($3, telefono),
           email = COALESCE($4, email),
           estado = COALESCE($5, estado),
           notas = COALESCE($6, notas),
           asignado_a = COALESCE($7, asignado_a),
           categoria = COALESCE($8, categoria),
           ciudad = COALESCE($9, ciudad),
           provincia = COALESCE($10, provincia),
           direccion = COALESCE($11, direccion),
           fecha_seguimiento = $12,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $13
       RETURNING *`,
      [nombre, empresa, telefono, email, estado, notas, asignado_a, cat, ciudad, provincia, direccion, fecha_seguimiento || null, id]
    );

    if (estado && estado !== oldEstado) {
      const eLabels = { sin_contactar: 'Sin Contactar', contactado: 'Contactado', interesado: 'Interesado', propuesta_enviada: 'Propuesta Enviada', cerrado_ganado: 'Ganado', cerrado_perdido: 'Perdido' };
      await pool.query(
        'INSERT INTO actividades (lead_id, usuario_id, accion, descripcion) VALUES ($1, $2, $3, $4)',
        [id, req.usuario.id, 'cambio_estado', `Estado cambiado de "${eLabels[oldEstado] || oldEstado}" a "${eLabels[estado] || estado}"`]
      );
    } else {
      await pool.query(
        'INSERT INTO actividades (lead_id, usuario_id, accion, descripcion) VALUES ($1, $2, $3, $4)',
        [id, req.usuario.id, 'editado', `Lead editado`]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    let result;
    if (req.usuario.rol === 'admin') {
      result = await pool.query('DELETE FROM leads WHERE id = $1 RETURNING id', [id]);
    } else {
      result = await pool.query('DELETE FROM leads WHERE id = $1 AND asignado_a = $2 RETURNING id', [id, req.usuario.id]);
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead no encontrado o sin acceso' });
    }

    await pool.query(
      'INSERT INTO actividades (lead_id, usuario_id, accion, descripcion) VALUES ($1, $2, $3, $4)',
      [id, req.usuario.id, 'eliminado', `Lead eliminado`]
    );

    res.json({ message: 'Lead eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.get('/:id/activity', auth, async (req, res) => {
  try {
    const { id } = req.params;

    let lead;
    if (req.usuario.rol === 'admin') {
      lead = await pool.query('SELECT * FROM leads WHERE id = $1', [id]);
    } else {
      lead = await pool.query('SELECT * FROM leads WHERE id = $1 AND asignado_a = $2', [id, req.usuario.id]);
    }

    if (lead.rows.length === 0) {
      return res.status(404).json({ error: 'Lead no encontrado o sin acceso' });
    }

    const activities = await pool.query(
      `SELECT a.*, u.nombre as usuario_nombre 
       FROM actividades a 
       LEFT JOIN usuarios u ON a.usuario_id = u.id 
       WHERE a.lead_id = $1 
       ORDER BY a.created_at DESC`,
      [id]
    );

    res.json(activities.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
