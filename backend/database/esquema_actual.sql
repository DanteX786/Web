-- ======================================================================
-- TABLAS
-- ======================================================================

-- empleados
    id_empleados character varying(10) NOT NULL DEFAULT fn_generar_id('EMP'::text, 'seq_empleados'::regclass),
    identificacion character varying(30) NOT NULL,
    nombre character varying(100) NOT NULL,
    direccion character varying(150),
    contrasena character varying(255) NOT NULL,
    correo character varying(100) NOT NULL,
    telefono character varying(20),
    estado character varying(20) NOT NULL DEFAULT 'Activo'::character varying,
    id_rol character varying(10) NOT NULL,
    version_token integer NOT NULL DEFAULT 0,
    debe_cambiar_contrasena boolean NOT NULL DEFAULT false

-- permisos
    id_permiso character varying(10) NOT NULL DEFAULT fn_generar_id('PER'::text, 'seq_permisos'::regclass),
    descripcion character varying(150) NOT NULL,
    modulo character varying(50) NOT NULL

-- proveedores
    id_proveedores character varying(10) NOT NULL DEFAULT fn_generar_id('PRV'::text, 'seq_proveedores'::regclass),
    nit character varying(30) NOT NULL,
    nombre character varying(100) NOT NULL,
    contacto character varying(100),
    telefono character varying(20),
    correo character varying(100),
    direccion character varying(150),
    estado character varying(20) NOT NULL DEFAULT 'Activo'::character varying

-- rol_x_permiso
    id_rol character varying(10) NOT NULL,
    id_permiso character varying(10) NOT NULL

-- roles
    id_rol character varying(10) NOT NULL DEFAULT fn_generar_id('ROL'::text, 'seq_roles'::regclass),
    descripcion_rol character varying(100) NOT NULL,
    estado character varying(20) NOT NULL DEFAULT 'Activo'::character varying,
    es_protegido boolean NOT NULL DEFAULT false

-- tb_asistencia
    id_asistencia character varying(10) NOT NULL DEFAULT fn_generar_id('ASI'::text, 'seq_asistencia'::regclass),
    id_empleado character varying(10) NOT NULL,
    fecha date NOT NULL DEFAULT fn_hoy(),
    estado character varying(20) NOT NULL DEFAULT 'No presente'::character varying,
    fecha_registro timestamp with time zone NOT NULL DEFAULT now(),
    registrado_por character varying(10),
    observacion character varying(150)

-- tb_asistencia_marcacion
    id_marcacion character varying(10) NOT NULL DEFAULT fn_generar_id('MAR'::text, 'seq_asistencia_marcacion'::regclass),
    id_asistencia character varying(10) NOT NULL,
    hora_entrada timestamp with time zone NOT NULL,
    hora_salida timestamp with time zone,
    tipo_salida character varying(20),
    motivo character varying(150),
    registrado_por character varying(10),
    fecha_registro timestamp with time zone NOT NULL DEFAULT now()

-- tb_clientes
    nit character varying(30) NOT NULL,
    nombre character varying(100) NOT NULL,
    direccion character varying(150),
    correo character varying(100) NOT NULL,
    telefono character varying(20),
    estado character varying(20) NOT NULL DEFAULT 'Activo'::character varying,
    contrasena character varying(255) NOT NULL,
    id_rol character varying(10) NOT NULL,
    tipo_documento character varying(10) NOT NULL DEFAULT 'NIT'::character varying,
    tipo_telefono character varying(15) NOT NULL DEFAULT 'Empresarial'::character varying,
    version_token integer NOT NULL DEFAULT 0,
    nombre_contacto character varying(100)

-- tb_codigos_recuperacion
    id_codigo character varying(10) NOT NULL DEFAULT fn_generar_id('COD'::text, 'seq_codigo_recuperacion'::regclass),
    correo character varying(100) NOT NULL,
    tipo_usuario character varying(10) NOT NULL,
    codigo_hash character varying(255) NOT NULL,
    intentos integer NOT NULL DEFAULT 0,
    usado boolean NOT NULL DEFAULT false,
    fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
    fecha_expiracion timestamp with time zone NOT NULL

-- tb_compras
    id_compras character varying(10) NOT NULL DEFAULT fn_generar_id('CMP'::text, 'seq_compras'::regclass),
    fecha_compra date NOT NULL DEFAULT CURRENT_DATE,
    total_compra numeric(12,2) NOT NULL DEFAULT 0,
    descripcion character varying(255),
    id_proveedor character varying(10) NOT NULL

-- tb_detalle_compras
    id_compras character varying(10) NOT NULL,
    id_insumos character varying(10) NOT NULL,
    cantidad integer NOT NULL,
    valor_unitario numeric(10,2) NOT NULL,
    subtotal numeric(12,2) DEFAULT ((cantidad)::numeric * valor_unitario)

-- tb_detalle_de_produccion
    id_detalle_de_produccion character varying(10) NOT NULL DEFAULT fn_generar_id('DPR'::text, 'seq_detalle_produccion'::regclass),
    id_produccion character varying(10) NOT NULL,
    id_empleado character varying(10) NOT NULL,
    id_tipo_pieza character varying(10) NOT NULL,
    id_tipo_maquina character varying(10) NOT NULL,
    id_detalle_de_remision character varying(10) NOT NULL,
    id_insumos character varying(10),
    id_insumos_enviados_x_cliente character varying(10),
    cantidad_insumo integer,
    cantidad_asignada integer NOT NULL,
    fecha_asignada date NOT NULL DEFAULT CURRENT_DATE,
    id_proceso character varying(10),
    id_paso character varying(10),
    id_reproceso character varying(10)

-- tb_detalle_rem
    id_detalle_de_remision character varying(10) NOT NULL DEFAULT fn_generar_id('DRM'::text, 'seq_detalle_rem'::regclass),
    id_remision character varying(10) NOT NULL,
    nombre_de_la_pieza character varying(100) NOT NULL,
    talla character varying(20) NOT NULL,
    cantidad integer NOT NULL

-- tb_insumos
    id_insumos character varying(10) NOT NULL DEFAULT fn_generar_id('INS'::text, 'seq_insumos'::regclass),
    nombre character varying(100) NOT NULL,
    descripcion_insumo character varying(255),
    unidad_medida character varying(20) NOT NULL DEFAULT 'Unidad'::character varying,
    stock integer NOT NULL DEFAULT 0,
    stock_minimo integer NOT NULL,
    stock_maximo integer NOT NULL,
    id_tipo_insumo character varying(10) NOT NULL,
    estado character varying(20) NOT NULL DEFAULT 'Activo'::character varying

-- tb_insumos_enviados_x_cliente
    id_insumo_enviado character varying(10) NOT NULL DEFAULT fn_generar_id('IEC'::text, 'seq_insumo_enviado'::regclass),
    id_remision character varying(10) NOT NULL,
    nombre character varying(100) NOT NULL,
    cantidad integer NOT NULL,
    cantidad_disponible integer,
    unidad character varying(20) NOT NULL DEFAULT 'Unidad'::character varying,
    id_reproceso character varying(10)

-- tb_pasos_produccion
    id_paso character varying(10) NOT NULL DEFAULT fn_generar_id('PAS'::text, 'seq_pasos_produccion'::regclass),
    id_produccion character varying(10) NOT NULL,
    id_proceso character varying(10) NOT NULL,
    descripcion character varying(100),
    id_reproceso character varying(10)

-- tb_proceso_x_maquina
    id_proceso character varying(10) NOT NULL,
    id_maquina character varying(10) NOT NULL

-- tb_procesos
    id_proceso character varying(10) NOT NULL DEFAULT fn_generar_id('PRC'::text, 'seq_procesos'::regclass),
    nombre character varying(100) NOT NULL,
    descripcion character varying(255),
    estado character varying(20) NOT NULL DEFAULT 'Activo'::character varying

-- tb_produccion
    id_produccion character varying(10) NOT NULL DEFAULT fn_generar_id('PRD'::text, 'seq_produccion'::regclass),
    id_remision character varying(10) NOT NULL,
    fecha_inicio date NOT NULL DEFAULT CURRENT_DATE,
    fecha_entrega date,
    estado character varying(20) NOT NULL DEFAULT 'Por asignar'::character varying,
    fecha_estado timestamp with time zone NOT NULL DEFAULT now()

-- tb_registro_diario
    id_registro_diario character varying(10) NOT NULL DEFAULT fn_generar_id('RGD'::text, 'seq_registro_diario'::regclass),
    id_detalle_de_produccion character varying(10) NOT NULL,
    cantidad integer NOT NULL,
    fecha timestamp with time zone NOT NULL DEFAULT now(),
    cantidad_defectuosa integer NOT NULL DEFAULT 0,
    motivo_defecto character varying(200)

-- tb_remision
    id_remision character varying(10) NOT NULL DEFAULT fn_generar_id('REM'::text, 'seq_remision'::regclass),
    nit_cliente character varying(30) NOT NULL,
    ficha_tecnica_nombre character varying(255) NOT NULL,
    ficha_tecnica_url character varying(255),
    fecha_recibo date NOT NULL DEFAULT CURRENT_DATE,
    fecha_entrega date,
    costo_prenda numeric(10,2) NOT NULL,
    total_prendas integer NOT NULL DEFAULT 0,
    costo_total numeric(12,2) DEFAULT (costo_prenda * (total_prendas)::numeric),
    estado character varying(20) NOT NULL DEFAULT 'Pendiente'::character varying,
    insumos_enviados boolean NOT NULL DEFAULT false,
    observaciones text

-- tb_remision_entrega
    id_entrega character varying(10) NOT NULL DEFAULT fn_generar_id('ENT'::text, 'seq_entrega'::regclass),
    id_remision character varying(10) NOT NULL,
    cantidad_entregada integer NOT NULL,
    precio_total numeric(12,2),
    fecha_finalizacion date NOT NULL DEFAULT CURRENT_DATE,
    remision_firmada_url character varying(255),
    comprobante_pago_url character varying(255),
    estado character varying(20) NOT NULL DEFAULT 'Pendiente de pago'::character varying

-- tb_reproceso
    id_reproceso character varying(10) NOT NULL DEFAULT fn_generar_id('RPR'::text, 'seq_reproceso'::regclass),
    id_produccion character varying(10) NOT NULL,
    numero integer NOT NULL,
    estado character varying(20) NOT NULL DEFAULT 'Abierto'::character varying,
    observacion character varying(200),
    creado_por character varying(10),
    fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
    fecha_estado timestamp with time zone NOT NULL DEFAULT now()

-- tb_reproceso_talla
    id_reproceso character varying(10) NOT NULL,
    id_detalle_de_remision character varying(10) NOT NULL,
    cantidad integer NOT NULL

-- tb_seguimiento_produccion
    id_seguimiento_produccion character varying(10) NOT NULL DEFAULT fn_generar_id('SGP'::text, 'seq_seguimiento_produccion'::regclass),
    id_produccion character varying(10) NOT NULL,
    estado_anterior character varying(20),
    estado_nuevo character varying(20) NOT NULL,
    responsable_empleado character varying(10),
    fecha_hora timestamp with time zone NOT NULL DEFAULT clock_timestamp()

-- tb_seguimiento_remision
    id_seguimiento character varying(10) NOT NULL DEFAULT fn_generar_id('SEG'::text, 'seq_seguimiento'::regclass),
    id_remision character varying(10) NOT NULL,
    estado_anterior character varying(20),
    estado_nuevo character varying(20) NOT NULL,
    responsable_empleado character varying(10),
    responsable_cliente character varying(30),
    fecha_hora timestamp with time zone NOT NULL DEFAULT clock_timestamp()

-- tb_tipo_insumos
    id_tipo_insumos character varying(10) NOT NULL DEFAULT fn_generar_id('TIN'::text, 'seq_tipo_insumos'::regclass),
    nombre character varying(100) NOT NULL,
    descripcion character varying(255),
    estado character varying(20) NOT NULL DEFAULT 'Activo'::character varying

-- tipo_de_maquina
    id_tipo_de_maquina character varying(10) NOT NULL DEFAULT fn_generar_id('TMQ'::text, 'seq_tipo_maquina'::regclass),
    nombre character varying(100) NOT NULL,
    descripcion character varying(255),
    estado character varying(20) NOT NULL DEFAULT 'Activo'::character varying

-- tipo_de_pieza
    id_tipo_de_pieza character varying(10) NOT NULL DEFAULT fn_generar_id('TPZ'::text, 'seq_tipo_pieza'::regclass),
    nombre character varying(100) NOT NULL,
    descripcion character varying(255),
    estado character varying(20) NOT NULL DEFAULT 'Activo'::character varying

-- ======================================================================
-- RESTRICCIONES
-- ======================================================================

-- empleados.empleados_contrasena_not_null
NOT NULL contrasena

-- empleados.empleados_correo_key
UNIQUE (correo)

-- empleados.empleados_correo_not_null
NOT NULL correo

-- empleados.empleados_debe_cambiar_contrasena_not_null
NOT NULL debe_cambiar_contrasena

-- empleados.empleados_estado_check
CHECK (((estado)::text = ANY ((ARRAY['Activo'::character varying, 'Inactivo'::character varying])::text[])))

-- empleados.empleados_estado_not_null
NOT NULL estado

-- empleados.empleados_id_empleados_not_null
NOT NULL id_empleados

-- empleados.empleados_id_rol_fkey
FOREIGN KEY (id_rol) REFERENCES roles(id_rol)

-- empleados.empleados_id_rol_not_null
NOT NULL id_rol

-- empleados.empleados_identificacion_key
UNIQUE (identificacion)

-- empleados.empleados_identificacion_not_null
NOT NULL identificacion

-- empleados.empleados_nombre_not_null
NOT NULL nombre

-- empleados.empleados_pkey
PRIMARY KEY (id_empleados)

-- empleados.empleados_version_token_not_null
NOT NULL version_token

-- permisos.permisos_descripcion_key
UNIQUE (descripcion)

-- permisos.permisos_descripcion_not_null
NOT NULL descripcion

-- permisos.permisos_id_permiso_not_null
NOT NULL id_permiso

-- permisos.permisos_modulo_not_null
NOT NULL modulo

-- permisos.permisos_pkey
PRIMARY KEY (id_permiso)

-- proveedores.proveedores_estado_check
CHECK (((estado)::text = ANY ((ARRAY['Activo'::character varying, 'Inactivo'::character varying])::text[])))

-- proveedores.proveedores_estado_not_null
NOT NULL estado

-- proveedores.proveedores_id_proveedores_not_null
NOT NULL id_proveedores

-- proveedores.proveedores_nit_key
UNIQUE (nit)

-- proveedores.proveedores_nit_not_null
NOT NULL nit

-- proveedores.proveedores_nombre_not_null
NOT NULL nombre

-- proveedores.proveedores_pkey
PRIMARY KEY (id_proveedores)

-- rol_x_permiso.rol_x_permiso_id_permiso_fkey
FOREIGN KEY (id_permiso) REFERENCES permisos(id_permiso) ON DELETE CASCADE

-- rol_x_permiso.rol_x_permiso_id_permiso_not_null
NOT NULL id_permiso

-- rol_x_permiso.rol_x_permiso_id_rol_fkey
FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE CASCADE

-- rol_x_permiso.rol_x_permiso_id_rol_not_null
NOT NULL id_rol

-- rol_x_permiso.rol_x_permiso_pkey
PRIMARY KEY (id_rol, id_permiso)

-- roles.roles_descripcion_rol_key
UNIQUE (descripcion_rol)

-- roles.roles_descripcion_rol_not_null
NOT NULL descripcion_rol

-- roles.roles_es_protegido_not_null
NOT NULL es_protegido

-- roles.roles_estado_check
CHECK (((estado)::text = ANY ((ARRAY['Activo'::character varying, 'Inactivo'::character varying])::text[])))

-- roles.roles_estado_not_null
NOT NULL estado

-- roles.roles_id_rol_not_null
NOT NULL id_rol

-- roles.roles_pkey
PRIMARY KEY (id_rol)

-- tb_asistencia.ck_asistencia_estado
CHECK (((estado)::text = ANY ((ARRAY['No presente'::character varying, 'Presente'::character varying, 'Permiso'::character varying, 'Incapacidad'::character varying, 'Vacaciones'::character varying])::text[])))

-- tb_asistencia.tb_asistencia_estado_not_null
NOT NULL estado

-- tb_asistencia.tb_asistencia_fecha_not_null
NOT NULL fecha

-- tb_asistencia.tb_asistencia_fecha_registro_not_null
NOT NULL fecha_registro

-- tb_asistencia.tb_asistencia_id_asistencia_not_null
NOT NULL id_asistencia

-- tb_asistencia.tb_asistencia_id_empleado_fkey
FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleados)

-- tb_asistencia.tb_asistencia_id_empleado_not_null
NOT NULL id_empleado

-- tb_asistencia.tb_asistencia_pkey
PRIMARY KEY (id_asistencia)

-- tb_asistencia.tb_asistencia_registrado_por_fkey
FOREIGN KEY (registrado_por) REFERENCES empleados(id_empleados)

-- tb_asistencia.uq_asistencia_empleado_fecha
UNIQUE (id_empleado, fecha)

-- tb_asistencia_marcacion.ck_marcacion_salida
CHECK ((((hora_salida IS NULL) AND (tipo_salida IS NULL)) OR ((hora_salida IS NOT NULL) AND (tipo_salida IS NOT NULL) AND (hora_salida > hora_entrada))))

-- tb_asistencia_marcacion.tb_asistencia_marcacion_fecha_registro_not_null
NOT NULL fecha_registro

-- tb_asistencia_marcacion.tb_asistencia_marcacion_hora_entrada_not_null
NOT NULL hora_entrada

-- tb_asistencia_marcacion.tb_asistencia_marcacion_id_asistencia_fkey
FOREIGN KEY (id_asistencia) REFERENCES tb_asistencia(id_asistencia) ON DELETE CASCADE

-- tb_asistencia_marcacion.tb_asistencia_marcacion_id_asistencia_not_null
NOT NULL id_asistencia

-- tb_asistencia_marcacion.tb_asistencia_marcacion_id_marcacion_not_null
NOT NULL id_marcacion

-- tb_asistencia_marcacion.tb_asistencia_marcacion_pkey
PRIMARY KEY (id_marcacion)

-- tb_asistencia_marcacion.tb_asistencia_marcacion_registrado_por_fkey
FOREIGN KEY (registrado_por) REFERENCES empleados(id_empleados)

-- tb_asistencia_marcacion.tb_asistencia_marcacion_tipo_salida_check
CHECK (((tipo_salida)::text = ANY ((ARRAY['Fin de jornada'::character varying, 'Permiso'::character varying])::text[])))

-- tb_clientes.ck_clientes_tipo_documento
CHECK (((tipo_documento)::text = ANY ((ARRAY['NIT'::character varying, 'CC'::character varying, 'CE'::character varying, 'PA'::character varying, 'PPT'::character varying])::text[])))

-- tb_clientes.ck_clientes_tipo_telefono
CHECK (((tipo_telefono)::text = ANY ((ARRAY['Empresarial'::character varying, 'Personal'::character varying])::text[])))

-- tb_clientes.tb_clientes_contrasena_not_null
NOT NULL contrasena

-- tb_clientes.tb_clientes_correo_key
UNIQUE (correo)

-- tb_clientes.tb_clientes_correo_not_null
NOT NULL correo

-- tb_clientes.tb_clientes_estado_check
CHECK (((estado)::text = ANY ((ARRAY['Activo'::character varying, 'Inactivo'::character varying])::text[])))

-- tb_clientes.tb_clientes_estado_not_null
NOT NULL estado

-- tb_clientes.tb_clientes_id_rol_fkey
FOREIGN KEY (id_rol) REFERENCES roles(id_rol)

-- tb_clientes.tb_clientes_id_rol_not_null
NOT NULL id_rol

-- tb_clientes.tb_clientes_nit_not_null
NOT NULL nit

-- tb_clientes.tb_clientes_nombre_not_null
NOT NULL nombre

-- tb_clientes.tb_clientes_pkey
PRIMARY KEY (nit)

-- tb_clientes.tb_clientes_tipo_documento_not_null
NOT NULL tipo_documento

-- tb_clientes.tb_clientes_tipo_telefono_not_null
NOT NULL tipo_telefono

-- tb_clientes.tb_clientes_version_token_not_null
NOT NULL version_token

-- tb_codigos_recuperacion.ck_codigo_expiracion
CHECK ((fecha_expiracion > fecha_creacion))

-- tb_codigos_recuperacion.tb_codigos_recuperacion_codigo_hash_not_null
NOT NULL codigo_hash

-- tb_codigos_recuperacion.tb_codigos_recuperacion_correo_not_null
NOT NULL correo

-- tb_codigos_recuperacion.tb_codigos_recuperacion_fecha_creacion_not_null
NOT NULL fecha_creacion

-- tb_codigos_recuperacion.tb_codigos_recuperacion_fecha_expiracion_not_null
NOT NULL fecha_expiracion

-- tb_codigos_recuperacion.tb_codigos_recuperacion_id_codigo_not_null
NOT NULL id_codigo

-- tb_codigos_recuperacion.tb_codigos_recuperacion_intentos_check
CHECK ((intentos >= 0))

-- tb_codigos_recuperacion.tb_codigos_recuperacion_intentos_not_null
NOT NULL intentos

-- tb_codigos_recuperacion.tb_codigos_recuperacion_pkey
PRIMARY KEY (id_codigo)

-- tb_codigos_recuperacion.tb_codigos_recuperacion_tipo_usuario_check
CHECK (((tipo_usuario)::text = ANY ((ARRAY['Empleado'::character varying, 'Cliente'::character varying])::text[])))

-- tb_codigos_recuperacion.tb_codigos_recuperacion_tipo_usuario_not_null
NOT NULL tipo_usuario

-- tb_codigos_recuperacion.tb_codigos_recuperacion_usado_not_null
NOT NULL usado

-- tb_compras.tb_compras_fecha_compra_not_null
NOT NULL fecha_compra

-- tb_compras.tb_compras_id_compras_not_null
NOT NULL id_compras

-- tb_compras.tb_compras_id_proveedor_fkey
FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedores)

-- tb_compras.tb_compras_id_proveedor_not_null
NOT NULL id_proveedor

-- tb_compras.tb_compras_pkey
PRIMARY KEY (id_compras)

-- tb_compras.tb_compras_total_compra_not_null
NOT NULL total_compra

-- tb_detalle_compras.tb_detalle_compras_cantidad_check
CHECK ((cantidad > 0))

-- tb_detalle_compras.tb_detalle_compras_cantidad_not_null
NOT NULL cantidad

-- tb_detalle_compras.tb_detalle_compras_id_compras_fkey
FOREIGN KEY (id_compras) REFERENCES tb_compras(id_compras) ON DELETE CASCADE

-- tb_detalle_compras.tb_detalle_compras_id_compras_not_null
NOT NULL id_compras

-- tb_detalle_compras.tb_detalle_compras_id_insumos_fkey
FOREIGN KEY (id_insumos) REFERENCES tb_insumos(id_insumos)

-- tb_detalle_compras.tb_detalle_compras_id_insumos_not_null
NOT NULL id_insumos

-- tb_detalle_compras.tb_detalle_compras_pkey
PRIMARY KEY (id_compras, id_insumos)

-- tb_detalle_compras.tb_detalle_compras_valor_unitario_check
CHECK ((valor_unitario >= (0)::numeric))

-- tb_detalle_compras.tb_detalle_compras_valor_unitario_not_null
NOT NULL valor_unitario

-- tb_detalle_de_produccion.ck_dp_cantidad_insumo
CHECK (((num_nonnulls(id_insumos, id_insumos_enviados_x_cliente) = 1) = (cantidad_insumo IS NOT NULL)))

-- tb_detalle_de_produccion.ck_dp_un_insumo
CHECK ((num_nonnulls(id_insumos, id_insumos_enviados_x_cliente) <= 1))

-- tb_detalle_de_produccion.tb_detalle_de_produccion_cantidad_asignada_check
CHECK ((cantidad_asignada > 0))

-- tb_detalle_de_produccion.tb_detalle_de_produccion_cantidad_asignada_not_null
NOT NULL cantidad_asignada

-- tb_detalle_de_produccion.tb_detalle_de_produccion_cantidad_insumo_check
CHECK ((cantidad_insumo > 0))

-- tb_detalle_de_produccion.tb_detalle_de_produccion_fecha_asignada_not_null
NOT NULL fecha_asignada

-- tb_detalle_de_produccion.tb_detalle_de_produccion_id_detalle_de_produccion_not_null
NOT NULL id_detalle_de_produccion

-- tb_detalle_de_produccion.tb_detalle_de_produccion_id_detalle_de_remision_fkey
FOREIGN KEY (id_detalle_de_remision) REFERENCES tb_detalle_rem(id_detalle_de_remision)

-- tb_detalle_de_produccion.tb_detalle_de_produccion_id_detalle_de_remision_not_null
NOT NULL id_detalle_de_remision

-- tb_detalle_de_produccion.tb_detalle_de_produccion_id_empleado_fkey
FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleados)

-- tb_detalle_de_produccion.tb_detalle_de_produccion_id_empleado_not_null
NOT NULL id_empleado

-- tb_detalle_de_produccion.tb_detalle_de_produccion_id_insumos_enviados_x_cliente_fkey
FOREIGN KEY (id_insumos_enviados_x_cliente) REFERENCES tb_insumos_enviados_x_cliente(id_insumo_enviado)

-- tb_detalle_de_produccion.tb_detalle_de_produccion_id_insumos_fkey
FOREIGN KEY (id_insumos) REFERENCES tb_insumos(id_insumos)

-- tb_detalle_de_produccion.tb_detalle_de_produccion_id_paso_fkey
FOREIGN KEY (id_paso) REFERENCES tb_pasos_produccion(id_paso)

-- tb_detalle_de_produccion.tb_detalle_de_produccion_id_proceso_fkey
FOREIGN KEY (id_proceso) REFERENCES tb_procesos(id_proceso)

-- tb_detalle_de_produccion.tb_detalle_de_produccion_id_produccion_fkey
FOREIGN KEY (id_produccion) REFERENCES tb_produccion(id_produccion) ON DELETE CASCADE

-- tb_detalle_de_produccion.tb_detalle_de_produccion_id_produccion_not_null
NOT NULL id_produccion

-- tb_detalle_de_produccion.tb_detalle_de_produccion_id_reproceso_fkey
FOREIGN KEY (id_reproceso) REFERENCES tb_reproceso(id_reproceso)

-- tb_detalle_de_produccion.tb_detalle_de_produccion_id_tipo_maquina_fkey
FOREIGN KEY (id_tipo_maquina) REFERENCES tipo_de_maquina(id_tipo_de_maquina)

-- tb_detalle_de_produccion.tb_detalle_de_produccion_id_tipo_maquina_not_null
NOT NULL id_tipo_maquina

-- tb_detalle_de_produccion.tb_detalle_de_produccion_id_tipo_pieza_fkey
FOREIGN KEY (id_tipo_pieza) REFERENCES tipo_de_pieza(id_tipo_de_pieza)

-- tb_detalle_de_produccion.tb_detalle_de_produccion_id_tipo_pieza_not_null
NOT NULL id_tipo_pieza

-- tb_detalle_de_produccion.tb_detalle_de_produccion_pkey
PRIMARY KEY (id_detalle_de_produccion)

-- tb_detalle_rem.tb_detalle_rem_cantidad_check
CHECK ((cantidad > 0))

-- tb_detalle_rem.tb_detalle_rem_cantidad_not_null
NOT NULL cantidad

-- tb_detalle_rem.tb_detalle_rem_id_detalle_de_remision_not_null
NOT NULL id_detalle_de_remision

-- tb_detalle_rem.tb_detalle_rem_id_remision_fkey
FOREIGN KEY (id_remision) REFERENCES tb_remision(id_remision) ON DELETE CASCADE

-- tb_detalle_rem.tb_detalle_rem_id_remision_not_null
NOT NULL id_remision

-- tb_detalle_rem.tb_detalle_rem_nombre_de_la_pieza_not_null
NOT NULL nombre_de_la_pieza

-- tb_detalle_rem.tb_detalle_rem_pkey
PRIMARY KEY (id_detalle_de_remision)

-- tb_detalle_rem.tb_detalle_rem_talla_not_null
NOT NULL talla

-- tb_detalle_rem.uq_detalle_rem
UNIQUE (id_remision, nombre_de_la_pieza, talla)

-- tb_insumos.ck_insumos_max_min
CHECK ((stock_maximo >= stock_minimo))

-- tb_insumos.tb_insumos_estado_check
CHECK (((estado)::text = ANY ((ARRAY['Activo'::character varying, 'Inactivo'::character varying])::text[])))

-- tb_insumos.tb_insumos_estado_not_null
NOT NULL estado

-- tb_insumos.tb_insumos_id_insumos_not_null
NOT NULL id_insumos

-- tb_insumos.tb_insumos_id_tipo_insumo_fkey
FOREIGN KEY (id_tipo_insumo) REFERENCES tb_tipo_insumos(id_tipo_insumos)

-- tb_insumos.tb_insumos_id_tipo_insumo_not_null
NOT NULL id_tipo_insumo

-- tb_insumos.tb_insumos_nombre_key
UNIQUE (nombre)

-- tb_insumos.tb_insumos_nombre_not_null
NOT NULL nombre

-- tb_insumos.tb_insumos_pkey
PRIMARY KEY (id_insumos)

-- tb_insumos.tb_insumos_stock_check
CHECK ((stock >= 0))

-- tb_insumos.tb_insumos_stock_maximo_not_null
NOT NULL stock_maximo

-- tb_insumos.tb_insumos_stock_minimo_check
CHECK ((stock_minimo >= 0))

-- tb_insumos.tb_insumos_stock_minimo_not_null
NOT NULL stock_minimo

-- tb_insumos.tb_insumos_stock_not_null
NOT NULL stock

-- tb_insumos.tb_insumos_unidad_medida_not_null
NOT NULL unidad_medida

-- tb_insumos_enviados_x_cliente.tb_insumos_enviados_x_cliente_cantidad_check
CHECK ((cantidad > 0))

-- tb_insumos_enviados_x_cliente.tb_insumos_enviados_x_cliente_cantidad_disponible_check
CHECK ((cantidad_disponible >= 0))

-- tb_insumos_enviados_x_cliente.tb_insumos_enviados_x_cliente_cantidad_not_null
NOT NULL cantidad

-- tb_insumos_enviados_x_cliente.tb_insumos_enviados_x_cliente_id_insumo_enviado_not_null
NOT NULL id_insumo_enviado

-- tb_insumos_enviados_x_cliente.tb_insumos_enviados_x_cliente_id_remision_fkey
FOREIGN KEY (id_remision) REFERENCES tb_remision(id_remision) ON DELETE CASCADE

-- tb_insumos_enviados_x_cliente.tb_insumos_enviados_x_cliente_id_remision_not_null
NOT NULL id_remision

-- tb_insumos_enviados_x_cliente.tb_insumos_enviados_x_cliente_id_reproceso_fkey
FOREIGN KEY (id_reproceso) REFERENCES tb_reproceso(id_reproceso)

-- tb_insumos_enviados_x_cliente.tb_insumos_enviados_x_cliente_nombre_not_null
NOT NULL nombre

-- tb_insumos_enviados_x_cliente.tb_insumos_enviados_x_cliente_pkey
PRIMARY KEY (id_insumo_enviado)

-- tb_insumos_enviados_x_cliente.tb_insumos_enviados_x_cliente_unidad_not_null
NOT NULL unidad

-- tb_pasos_produccion.tb_pasos_produccion_id_paso_not_null
NOT NULL id_paso

-- tb_pasos_produccion.tb_pasos_produccion_id_proceso_fkey
FOREIGN KEY (id_proceso) REFERENCES tb_procesos(id_proceso)

-- tb_pasos_produccion.tb_pasos_produccion_id_proceso_not_null
NOT NULL id_proceso

-- tb_pasos_produccion.tb_pasos_produccion_id_produccion_fkey
FOREIGN KEY (id_produccion) REFERENCES tb_produccion(id_produccion) ON DELETE CASCADE

-- tb_pasos_produccion.tb_pasos_produccion_id_produccion_not_null
NOT NULL id_produccion

-- tb_pasos_produccion.tb_pasos_produccion_id_reproceso_fkey
FOREIGN KEY (id_reproceso) REFERENCES tb_reproceso(id_reproceso) ON DELETE CASCADE

-- tb_pasos_produccion.tb_pasos_produccion_pkey
PRIMARY KEY (id_paso)

-- tb_proceso_x_maquina.tb_proceso_x_maquina_id_maquina_fkey
FOREIGN KEY (id_maquina) REFERENCES tipo_de_maquina(id_tipo_de_maquina) ON DELETE CASCADE

-- tb_proceso_x_maquina.tb_proceso_x_maquina_id_maquina_not_null
NOT NULL id_maquina

-- tb_proceso_x_maquina.tb_proceso_x_maquina_id_proceso_fkey
FOREIGN KEY (id_proceso) REFERENCES tb_procesos(id_proceso) ON DELETE CASCADE

-- tb_proceso_x_maquina.tb_proceso_x_maquina_id_proceso_not_null
NOT NULL id_proceso

-- tb_proceso_x_maquina.tb_proceso_x_maquina_pkey
PRIMARY KEY (id_proceso, id_maquina)

-- tb_procesos.tb_procesos_estado_check
CHECK (((estado)::text = ANY ((ARRAY['Activo'::character varying, 'Inactivo'::character varying])::text[])))

-- tb_procesos.tb_procesos_estado_not_null
NOT NULL estado

-- tb_procesos.tb_procesos_id_proceso_not_null
NOT NULL id_proceso

-- tb_procesos.tb_procesos_nombre_key
UNIQUE (nombre)

-- tb_procesos.tb_procesos_nombre_not_null
NOT NULL nombre

-- tb_procesos.tb_procesos_pkey
PRIMARY KEY (id_proceso)

-- tb_produccion.ck_produccion_fechas
CHECK (((fecha_entrega IS NULL) OR (fecha_entrega >= fecha_inicio)))

-- tb_produccion.tb_produccion_estado_check
CHECK (((estado)::text = ANY ((ARRAY['Por asignar'::character varying, 'En producción'::character varying, 'Finalizada'::character varying])::text[])))

-- tb_produccion.tb_produccion_estado_not_null
NOT NULL estado

-- tb_produccion.tb_produccion_fecha_estado_not_null
NOT NULL fecha_estado

-- tb_produccion.tb_produccion_fecha_inicio_not_null
NOT NULL fecha_inicio

-- tb_produccion.tb_produccion_id_produccion_not_null
NOT NULL id_produccion

-- tb_produccion.tb_produccion_id_remision_fkey
FOREIGN KEY (id_remision) REFERENCES tb_remision(id_remision)

-- tb_produccion.tb_produccion_id_remision_key
UNIQUE (id_remision)

-- tb_produccion.tb_produccion_id_remision_not_null
NOT NULL id_remision

-- tb_produccion.tb_produccion_pkey
PRIMARY KEY (id_produccion)

-- tb_registro_diario.ck_registro_cantidades
CHECK (((cantidad >= 0) AND (cantidad_defectuosa >= 0) AND ((cantidad + cantidad_defectuosa) > 0)))

-- tb_registro_diario.tb_registro_diario_cantidad_defectuosa_not_null
NOT NULL cantidad_defectuosa

-- tb_registro_diario.tb_registro_diario_cantidad_not_null
NOT NULL cantidad

-- tb_registro_diario.tb_registro_diario_fecha_not_null
NOT NULL fecha

-- tb_registro_diario.tb_registro_diario_id_detalle_de_produccion_fkey
FOREIGN KEY (id_detalle_de_produccion) REFERENCES tb_detalle_de_produccion(id_detalle_de_produccion)

-- tb_registro_diario.tb_registro_diario_id_detalle_de_produccion_not_null
NOT NULL id_detalle_de_produccion

-- tb_registro_diario.tb_registro_diario_id_registro_diario_not_null
NOT NULL id_registro_diario

-- tb_registro_diario.tb_registro_diario_pkey
PRIMARY KEY (id_registro_diario)

-- tb_remision.ck_remision_fechas
CHECK (((fecha_entrega IS NULL) OR (fecha_entrega >= fecha_recibo)))

-- tb_remision.tb_remision_costo_prenda_check
CHECK ((costo_prenda >= (0)::numeric))

-- tb_remision.tb_remision_costo_prenda_not_null
NOT NULL costo_prenda

-- tb_remision.tb_remision_estado_check
CHECK (((estado)::text = ANY ((ARRAY['Pendiente'::character varying, 'Aprobada'::character varying, 'Rechazada'::character varying, 'En producción'::character varying, 'Terminada'::character varying, 'Entregada'::character varying])::text[])))

-- tb_remision.tb_remision_estado_not_null
NOT NULL estado

-- tb_remision.tb_remision_fecha_recibo_not_null
NOT NULL fecha_recibo

-- tb_remision.tb_remision_ficha_tecnica_nombre_not_null
NOT NULL ficha_tecnica_nombre

-- tb_remision.tb_remision_id_remision_not_null
NOT NULL id_remision

-- tb_remision.tb_remision_insumos_enviados_not_null
NOT NULL insumos_enviados

-- tb_remision.tb_remision_nit_cliente_fkey
FOREIGN KEY (nit_cliente) REFERENCES tb_clientes(nit)

-- tb_remision.tb_remision_nit_cliente_not_null
NOT NULL nit_cliente

-- tb_remision.tb_remision_pkey
PRIMARY KEY (id_remision)

-- tb_remision.tb_remision_total_prendas_not_null
NOT NULL total_prendas

-- tb_remision_entrega.ck_entrega_pagada
CHECK ((((estado)::text <> 'Pagada'::text) OR (comprobante_pago_url IS NOT NULL)))

-- tb_remision_entrega.tb_remision_entrega_cantidad_entregada_check
CHECK ((cantidad_entregada > 0))

-- tb_remision_entrega.tb_remision_entrega_cantidad_entregada_not_null
NOT NULL cantidad_entregada

-- tb_remision_entrega.tb_remision_entrega_estado_check
CHECK (((estado)::text = ANY ((ARRAY['Pendiente de pago'::character varying, 'Pagada'::character varying])::text[])))

-- tb_remision_entrega.tb_remision_entrega_estado_not_null
NOT NULL estado

-- tb_remision_entrega.tb_remision_entrega_fecha_finalizacion_not_null
NOT NULL fecha_finalizacion

-- tb_remision_entrega.tb_remision_entrega_id_entrega_not_null
NOT NULL id_entrega

-- tb_remision_entrega.tb_remision_entrega_id_remision_fkey
FOREIGN KEY (id_remision) REFERENCES tb_remision(id_remision)

-- tb_remision_entrega.tb_remision_entrega_id_remision_not_null
NOT NULL id_remision

-- tb_remision_entrega.tb_remision_entrega_pkey
PRIMARY KEY (id_entrega)

-- tb_remision_entrega.tb_remision_entrega_precio_total_check
CHECK ((precio_total >= (0)::numeric))

-- tb_reproceso.tb_reproceso_creado_por_fkey
FOREIGN KEY (creado_por) REFERENCES empleados(id_empleados)

-- tb_reproceso.tb_reproceso_estado_check
CHECK (((estado)::text = ANY ((ARRAY['Abierto'::character varying, 'Cancelado'::character varying])::text[])))

-- tb_reproceso.tb_reproceso_estado_not_null
NOT NULL estado

-- tb_reproceso.tb_reproceso_fecha_creacion_not_null
NOT NULL fecha_creacion

-- tb_reproceso.tb_reproceso_fecha_estado_not_null
NOT NULL fecha_estado

-- tb_reproceso.tb_reproceso_id_produccion_fkey
FOREIGN KEY (id_produccion) REFERENCES tb_produccion(id_produccion) ON DELETE CASCADE

-- tb_reproceso.tb_reproceso_id_produccion_not_null
NOT NULL id_produccion

-- tb_reproceso.tb_reproceso_id_reproceso_not_null
NOT NULL id_reproceso

-- tb_reproceso.tb_reproceso_numero_not_null
NOT NULL numero

-- tb_reproceso.tb_reproceso_pkey
PRIMARY KEY (id_reproceso)

-- tb_reproceso.uq_reproceso_numero
UNIQUE (id_produccion, numero)

-- tb_reproceso_talla.tb_reproceso_talla_cantidad_check
CHECK ((cantidad > 0))

-- tb_reproceso_talla.tb_reproceso_talla_cantidad_not_null
NOT NULL cantidad

-- tb_reproceso_talla.tb_reproceso_talla_id_detalle_de_remision_fkey
FOREIGN KEY (id_detalle_de_remision) REFERENCES tb_detalle_rem(id_detalle_de_remision)

-- tb_reproceso_talla.tb_reproceso_talla_id_detalle_de_remision_not_null
NOT NULL id_detalle_de_remision

-- tb_reproceso_talla.tb_reproceso_talla_id_reproceso_fkey
FOREIGN KEY (id_reproceso) REFERENCES tb_reproceso(id_reproceso) ON DELETE CASCADE

-- tb_reproceso_talla.tb_reproceso_talla_id_reproceso_not_null
NOT NULL id_reproceso

-- tb_reproceso_talla.tb_reproceso_talla_pkey
PRIMARY KEY (id_reproceso, id_detalle_de_remision)

-- tb_seguimiento_produccion.tb_seguimiento_produccion_estado_nuevo_not_null
NOT NULL estado_nuevo

-- tb_seguimiento_produccion.tb_seguimiento_produccion_fecha_hora_not_null
NOT NULL fecha_hora

-- tb_seguimiento_produccion.tb_seguimiento_produccion_id_produccion_fkey
FOREIGN KEY (id_produccion) REFERENCES tb_produccion(id_produccion) ON DELETE CASCADE

-- tb_seguimiento_produccion.tb_seguimiento_produccion_id_produccion_not_null
NOT NULL id_produccion

-- tb_seguimiento_produccion.tb_seguimiento_produccion_id_seguimiento_produccion_not_null
NOT NULL id_seguimiento_produccion

-- tb_seguimiento_produccion.tb_seguimiento_produccion_pkey
PRIMARY KEY (id_seguimiento_produccion)

-- tb_seguimiento_produccion.tb_seguimiento_produccion_responsable_empleado_fkey
FOREIGN KEY (responsable_empleado) REFERENCES empleados(id_empleados)

-- tb_seguimiento_remision.ck_seguimiento_un_responsable
CHECK ((num_nonnulls(responsable_empleado, responsable_cliente) = 1))

-- tb_seguimiento_remision.tb_seguimiento_remision_estado_nuevo_not_null
NOT NULL estado_nuevo

-- tb_seguimiento_remision.tb_seguimiento_remision_fecha_hora_not_null
NOT NULL fecha_hora

-- tb_seguimiento_remision.tb_seguimiento_remision_id_remision_fkey
FOREIGN KEY (id_remision) REFERENCES tb_remision(id_remision) ON DELETE CASCADE

-- tb_seguimiento_remision.tb_seguimiento_remision_id_remision_not_null
NOT NULL id_remision

-- tb_seguimiento_remision.tb_seguimiento_remision_id_seguimiento_not_null
NOT NULL id_seguimiento

-- tb_seguimiento_remision.tb_seguimiento_remision_pkey
PRIMARY KEY (id_seguimiento)

-- tb_seguimiento_remision.tb_seguimiento_remision_responsable_cliente_fkey
FOREIGN KEY (responsable_cliente) REFERENCES tb_clientes(nit)

-- tb_seguimiento_remision.tb_seguimiento_remision_responsable_empleado_fkey
FOREIGN KEY (responsable_empleado) REFERENCES empleados(id_empleados)

-- tb_tipo_insumos.tb_tipo_insumos_estado_check
CHECK (((estado)::text = ANY ((ARRAY['Activo'::character varying, 'Inactivo'::character varying])::text[])))

-- tb_tipo_insumos.tb_tipo_insumos_estado_not_null
NOT NULL estado

-- tb_tipo_insumos.tb_tipo_insumos_id_tipo_insumos_not_null
NOT NULL id_tipo_insumos

-- tb_tipo_insumos.tb_tipo_insumos_nombre_key
UNIQUE (nombre)

-- tb_tipo_insumos.tb_tipo_insumos_nombre_not_null
NOT NULL nombre

-- tb_tipo_insumos.tb_tipo_insumos_pkey
PRIMARY KEY (id_tipo_insumos)

-- tipo_de_maquina.tipo_de_maquina_estado_check
CHECK (((estado)::text = ANY ((ARRAY['Activo'::character varying, 'Inactivo'::character varying])::text[])))

-- tipo_de_maquina.tipo_de_maquina_estado_not_null
NOT NULL estado

-- tipo_de_maquina.tipo_de_maquina_id_tipo_de_maquina_not_null
NOT NULL id_tipo_de_maquina

-- tipo_de_maquina.tipo_de_maquina_nombre_key
UNIQUE (nombre)

-- tipo_de_maquina.tipo_de_maquina_nombre_not_null
NOT NULL nombre

-- tipo_de_maquina.tipo_de_maquina_pkey
PRIMARY KEY (id_tipo_de_maquina)

-- tipo_de_pieza.tipo_de_pieza_estado_check
CHECK (((estado)::text = ANY ((ARRAY['Activo'::character varying, 'Inactivo'::character varying])::text[])))

-- tipo_de_pieza.tipo_de_pieza_estado_not_null
NOT NULL estado

-- tipo_de_pieza.tipo_de_pieza_id_tipo_de_pieza_not_null
NOT NULL id_tipo_de_pieza

-- tipo_de_pieza.tipo_de_pieza_nombre_key
UNIQUE (nombre)

-- tipo_de_pieza.tipo_de_pieza_nombre_not_null
NOT NULL nombre

-- tipo_de_pieza.tipo_de_pieza_pkey
PRIMARY KEY (id_tipo_de_pieza)

-- ======================================================================
-- SECUENCIAS
-- ======================================================================

-- seq_asistencia
start 1 last 432

-- seq_asistencia_marcacion
start 1 last 10

-- seq_codigo_recuperacion
start 1 last -

-- seq_compras
start 1 last 1

-- seq_detalle_produccion
start 1 last 8

-- seq_detalle_rem
start 1 last 4

-- seq_empleados
start 1 last 8

-- seq_entrega
start 1 last -

-- seq_insumo_enviado
start 1 last 5

-- seq_insumos
start 1 last 11

-- seq_pasos_produccion
start 1 last 6

-- seq_permisos
start 1 last 14

-- seq_procesos
start 1 last 14

-- seq_produccion
start 1 last 2

-- seq_proveedores
start 1 last 2

-- seq_registro_diario
start 1 last 8

-- seq_remision
start 1 last 2

-- seq_reproceso
start 1 last 1

-- seq_roles
start 1 last 10

-- seq_seguimiento
start 1 last 6

-- seq_seguimiento_produccion
start 1 last 3

-- seq_tipo_insumos
start 1 last 6

-- seq_tipo_maquina
start 1 last 6

-- seq_tipo_pieza
start 1 last 7

-- ======================================================================
-- VISTAS
-- ======================================================================

-- vw_asignaciones
 SELECT d.id_detalle_de_produccion,
    d.id_produccion,
    p.id_remision,
    p.estado AS estado_produccion,
    d.id_empleado,
    e.nombre AS empleado,
    tp.nombre AS pieza,
    tm.nombre AS maquina,
    dr.nombre_de_la_pieza AS prenda,
    dr.talla,
    d.cantidad_asignada,
    COALESCE(sum(rd.cantidad), 0::bigint)::integer AS cantidad_realizada,
    (d.cantidad_asignada - COALESCE(sum(rd.cantidad + rd.cantidad_defectuosa), 0::bigint))::integer AS cantidad_pendiente,
    d.fecha_asignada,
    d.id_proceso,
    pr.nombre AS proceso,
    d.id_paso,
    pr.nombre::text || COALESCE(' — '::text || ps.descripcion::text, ''::text) AS paso,
    COALESCE(sum(rd.cantidad_defectuosa), 0::bigint)::integer AS cantidad_defectuosa,
    d.id_reproceso
   FROM tb_detalle_de_produccion d
     JOIN tb_produccion p ON p.id_produccion::text = d.id_produccion::text
     JOIN empleados e ON e.id_empleados::text = d.id_empleado::text
     JOIN tipo_de_pieza tp ON tp.id_tipo_de_pieza::text = d.id_tipo_pieza::text
     JOIN tipo_de_maquina tm ON tm.id_tipo_de_maquina::text = d.id_tipo_maquina::text
     JOIN tb_detalle_rem dr ON dr.id_detalle_de_remision::text = d.id_detalle_de_remision::text
     LEFT JOIN tb_procesos pr ON pr.id_proceso::text = d.id_proceso::text
     LEFT JOIN tb_pasos_produccion ps ON ps.id_paso::text = d.id_paso::text
     LEFT JOIN tb_registro_diario rd ON rd.id_detalle_de_produccion::text = d.id_detalle_de_produccion::text
  GROUP BY d.id_detalle_de_produccion, p.id_remision, p.estado, e.nombre, tp.nombre, tm.nombre, dr.nombre_de_la_pieza, dr.talla, pr.nombre, ps.descripcion;

-- vw_asistencia
 SELECT a.id_asistencia,
    a.fecha,
    a.id_empleado,
    e.nombre AS empleado,
    e.identificacion,
    r.descripcion_rol AS rol,
    a.estado,
    a.observacion,
    a.fecha_registro,
    a.registrado_por,
    rp.nombre AS registrado_por_nombre,
    (EXISTS ( SELECT 1
           FROM tb_asistencia_marcacion m
          WHERE m.id_asistencia::text = a.id_asistencia::text AND m.hora_salida IS NULL AND a.fecha = fn_hoy())) AS en_taller,
    COALESCE(( SELECT sum(v.minutos) AS sum
           FROM vw_asistencia_marcacion v
          WHERE v.id_asistencia::text = a.id_asistencia::text), 0::bigint)::integer AS minutos_trabajados
   FROM tb_asistencia a
     JOIN empleados e ON e.id_empleados::text = a.id_empleado::text
     LEFT JOIN roles r ON r.id_rol::text = e.id_rol::text
     LEFT JOIN empleados rp ON rp.id_empleados::text = a.registrado_por::text;

-- vw_asistencia_marcacion
 SELECT m.id_marcacion,
    m.id_asistencia,
    a.id_empleado,
    e.nombre AS empleado,
    a.fecha,
    m.hora_entrada,
    m.hora_salida,
    m.tipo_salida,
    m.motivo,
        CASE
            WHEN m.hora_salida IS NOT NULL THEN floor(EXTRACT(epoch FROM m.hora_salida - m.hora_entrada) / 60::numeric)
            WHEN a.fecha = fn_hoy() THEN floor(EXTRACT(epoch FROM now() - m.hora_entrada) / 60::numeric)
            ELSE 0::numeric
        END::integer AS minutos,
    m.hora_salida IS NULL AND a.fecha < fn_hoy() AS sin_salida,
    m.registrado_por,
    rp.nombre AS registrado_por_nombre,
    m.fecha_registro
   FROM tb_asistencia_marcacion m
     JOIN tb_asistencia a ON a.id_asistencia::text = m.id_asistencia::text
     JOIN empleados e ON e.id_empleados::text = a.id_empleado::text
     LEFT JOIN empleados rp ON rp.id_empleados::text = m.registrado_por::text;

-- vw_avance_produccion
 SELECT p.id_produccion,
    p.id_remision,
    c.nombre AS cliente,
    p.estado,
    p.fecha_inicio,
    p.fecha_entrega,
    COALESCE(sum(a.cantidad_asignada), 0::bigint)::integer AS total_asignado,
    COALESCE(sum(a.cantidad_realizada), 0::bigint)::integer AS total_realizado,
        CASE
            WHEN COALESCE(sum(a.cantidad_asignada), 0::bigint) = 0 THEN 0::numeric
            ELSE round(100.0 * sum(a.cantidad_realizada + a.cantidad_defectuosa)::numeric / sum(a.cantidad_asignada)::numeric, 1)
        END AS porcentaje_avance,
    p.fecha_estado,
    r.total_prendas,
    r.ficha_tecnica_nombre,
    COALESCE(sum(a.cantidad_defectuosa), 0::bigint)::integer AS total_defectuoso,
    COALESCE(sum(a.cantidad_pendiente), 0::bigint)::integer AS total_pendiente
   FROM tb_produccion p
     JOIN tb_remision r ON r.id_remision::text = p.id_remision::text
     JOIN tb_clientes c ON c.nit::text = r.nit_cliente::text
     LEFT JOIN vw_asignaciones a ON a.id_produccion::text = p.id_produccion::text
  GROUP BY p.id_produccion, r.id_remision, c.nombre;

-- vw_defectuosas_por_talla
 SELECT p.id_produccion,
    dr.id_detalle_de_remision,
    dr.nombre_de_la_pieza,
    dr.talla,
    COALESCE(( SELECT sum(rd.cantidad_defectuosa) AS sum
           FROM tb_registro_diario rd
             JOIN tb_detalle_de_produccion d USING (id_detalle_de_produccion)
          WHERE d.id_produccion::text = p.id_produccion::text AND d.id_detalle_de_remision::text = dr.id_detalle_de_remision::text), 0::bigint)::integer AS defectuosas,
    COALESCE(( SELECT sum(rt.cantidad) AS sum
           FROM tb_reproceso_talla rt
             JOIN tb_reproceso r ON r.id_reproceso::text = rt.id_reproceso::text
          WHERE r.id_produccion::text = p.id_produccion::text AND r.estado::text <> 'Cancelado'::text AND rt.id_detalle_de_remision::text = dr.id_detalle_de_remision::text), 0::bigint)::integer AS en_reproceso
   FROM tb_produccion p
     JOIN tb_detalle_rem dr ON dr.id_remision::text = p.id_remision::text;

-- vw_empleados_disponibilidad
 SELECT e.id_empleados AS id_empleado,
    e.nombre,
    o.id_detalle_de_produccion AS ocupado_en_tarea,
    o.id_produccion AS ocupado_en_produccion,
    o.cantidad_pendiente AS unidades_pendientes,
    o.id_detalle_de_produccion IS NULL AND COALESCE(asis.en_taller, false) AS disponible,
    COALESCE(asis.estado::text = 'Presente'::text, false) AS presente_hoy,
    COALESCE(asis.en_taller, false) AS en_taller,
    COALESCE(asis.estado, 'No presente'::character varying) AS estado_asistencia
   FROM empleados e
     LEFT JOIN LATERAL ( SELECT a.id_detalle_de_produccion,
            a.id_produccion,
            a.cantidad_pendiente
           FROM vw_asignaciones a
          WHERE a.id_empleado::text = e.id_empleados::text AND a.estado_produccion::text <> 'Finalizada'::text AND a.cantidad_pendiente > 0
          ORDER BY a.fecha_asignada
         LIMIT 1) o ON true
     LEFT JOIN vw_asistencia asis ON asis.id_empleado::text = e.id_empleados::text AND asis.fecha = fn_hoy()
  WHERE e.estado::text = 'Activo'::text;

-- vw_historial_registro_diario
 SELECT rd.id_registro_diario,
    rd.fecha,
    a.id_empleado,
    a.empleado,
    a.pieza,
    a.maquina,
    a.prenda,
    a.talla,
    rd.cantidad,
    a.id_produccion,
    a.id_remision,
    a.proceso,
    rd.cantidad_defectuosa,
    rd.motivo_defecto,
    a.paso,
    rd.id_detalle_de_produccion
   FROM tb_registro_diario rd
     JOIN vw_asignaciones a ON a.id_detalle_de_produccion::text = rd.id_detalle_de_produccion::text;

-- vw_inventario
 SELECT i.id_insumos AS id,
    i.nombre,
    t.nombre AS tipo,
    'Taller'::text AS origen,
    i.stock AS disponible,
    i.unidad_medida AS unidad,
    i.stock_minimo,
    i.stock_maximo,
    i.stock <= i.stock_minimo AS alerta_stock_minimo,
    NULL::character varying AS id_remision,
    NULL::character varying AS cliente,
    i.estado
   FROM tb_insumos i
     JOIN tb_tipo_insumos t ON t.id_tipo_insumos::text = i.id_tipo_insumo::text
UNION ALL
 SELECT e.id_insumo_enviado AS id,
    e.nombre,
    NULL::character varying AS tipo,
    'Cliente'::text AS origen,
    e.cantidad_disponible AS disponible,
    e.unidad,
    NULL::integer AS stock_minimo,
    NULL::integer AS stock_maximo,
    false AS alerta_stock_minimo,
    r.id_remision,
    c.nombre AS cliente,
    r.estado
   FROM tb_insumos_enviados_x_cliente e
     JOIN tb_remision r ON r.id_remision::text = e.id_remision::text
     JOIN tb_clientes c ON c.nit::text = r.nit_cliente::text;

-- vw_maquinas_disponibilidad
 SELECT m.id_tipo_de_maquina AS id_maquina,
    m.nombre,
    m.descripcion,
    m.estado,
    o.id_detalle_de_produccion AS ocupada_por_tarea,
    o.empleado AS ocupada_por_empleado,
    o.id_produccion AS ocupada_en_produccion,
    o.id_detalle_de_produccion IS NULL AS disponible
   FROM tipo_de_maquina m
     LEFT JOIN LATERAL ( SELECT a.id_detalle_de_produccion,
            a.empleado,
            a.id_produccion
           FROM tb_detalle_de_produccion d
             JOIN vw_asignaciones a ON a.id_detalle_de_produccion::text = d.id_detalle_de_produccion::text
          WHERE d.id_tipo_maquina::text = m.id_tipo_de_maquina::text AND a.estado_produccion::text <> 'Finalizada'::text AND a.cantidad_pendiente > 0
          ORDER BY a.fecha_asignada
         LIMIT 1) o ON true;

-- vw_pasos_produccion
 SELECT p.id_paso,
    p.id_produccion,
    p.id_proceso,
    pr.nombre AS proceso,
    p.descripcion,
    pr.nombre::text || COALESCE(' — '::text || p.descripcion::text, ''::text) AS paso,
    p.id_reproceso
   FROM tb_pasos_produccion p
     JOIN tb_procesos pr ON pr.id_proceso::text = p.id_proceso::text;

-- vw_produccion_faltantes
 WITH base AS (
         SELECT p.id_produccion,
            dr.id_detalle_de_remision,
            dr.nombre_de_la_pieza,
            dr.talla,
            ps.id_paso,
            ps.paso,
            dr.cantidad AS cantidad_talla,
            COALESCE(( SELECT sum(d.cantidad_asignada) AS sum
                   FROM tb_detalle_de_produccion d
                  WHERE d.id_paso::text = ps.id_paso::text AND d.id_detalle_de_remision::text = dr.id_detalle_de_remision::text), 0::bigint)::integer AS asignado,
            COALESCE(( SELECT sum(rd.cantidad_defectuosa) AS sum
                   FROM tb_registro_diario rd
                     JOIN tb_detalle_de_produccion d USING (id_detalle_de_produccion)
                  WHERE d.id_produccion::text = p.id_produccion::text AND d.id_detalle_de_remision::text = dr.id_detalle_de_remision::text AND d.id_reproceso IS NULL AND d.id_paso::text IS DISTINCT FROM ps.id_paso::text), 0::bigint)::integer AS defectuosas_otros_pasos
           FROM tb_produccion p
             JOIN vw_pasos_produccion ps ON ps.id_produccion::text = p.id_produccion::text AND ps.id_reproceso IS NULL
             JOIN tb_detalle_rem dr ON dr.id_remision::text = p.id_remision::text
        )
 SELECT id_produccion,
    id_detalle_de_remision,
    nombre_de_la_pieza,
    talla,
    id_paso,
    paso,
    GREATEST(cantidad_talla - defectuosas_otros_pasos, 0) AS cantidad,
    asignado,
    defectuosas_otros_pasos
   FROM base
  WHERE asignado < (cantidad_talla - defectuosas_otros_pasos);

-- vw_reproceso_faltantes
 WITH base AS (
         SELECT r.id_reproceso,
            r.id_produccion,
            rt.id_detalle_de_remision,
            dr.nombre_de_la_pieza,
            dr.talla,
            ps.id_paso,
            ps.paso,
            rt.cantidad AS cantidad_reproceso,
            COALESCE(( SELECT sum(d.cantidad_asignada) AS sum
                   FROM tb_detalle_de_produccion d
                  WHERE d.id_paso::text = ps.id_paso::text AND d.id_detalle_de_remision::text = rt.id_detalle_de_remision::text), 0::bigint)::integer AS asignado,
            COALESCE(( SELECT sum(rd.cantidad_defectuosa) AS sum
                   FROM tb_registro_diario rd
                     JOIN tb_detalle_de_produccion d USING (id_detalle_de_produccion)
                  WHERE d.id_reproceso::text = r.id_reproceso::text AND d.id_detalle_de_remision::text = rt.id_detalle_de_remision::text AND d.id_paso::text <> ps.id_paso::text), 0::bigint)::integer AS defectuosas_otros_pasos
           FROM tb_reproceso r
             JOIN tb_reproceso_talla rt ON rt.id_reproceso::text = r.id_reproceso::text
             JOIN tb_detalle_rem dr ON dr.id_detalle_de_remision::text = rt.id_detalle_de_remision::text
             JOIN vw_pasos_produccion ps ON ps.id_reproceso::text = r.id_reproceso::text
          WHERE r.estado::text = 'Abierto'::text
        )
 SELECT id_reproceso,
    id_produccion,
    id_detalle_de_remision,
    nombre_de_la_pieza,
    talla,
    id_paso,
    paso,
    GREATEST(cantidad_reproceso - defectuosas_otros_pasos, 0) AS cantidad,
    asignado,
    defectuosas_otros_pasos
   FROM base
  WHERE asignado < (cantidad_reproceso - defectuosas_otros_pasos);

-- vw_reprocesos
 SELECT r.id_reproceso,
    r.id_produccion,
    r.numero,
    r.estado,
    r.observacion,
    r.creado_por,
    e.nombre AS creado_por_nombre,
    r.fecha_creacion,
    r.fecha_estado,
    COALESCE(( SELECT sum(tb_reproceso_talla.cantidad) AS sum
           FROM tb_reproceso_talla
          WHERE tb_reproceso_talla.id_reproceso::text = r.id_reproceso::text), 0::bigint)::integer AS total_piezas,
    (( SELECT count(*) AS count
           FROM tb_detalle_de_produccion
          WHERE tb_detalle_de_produccion.id_reproceso::text = r.id_reproceso::text))::integer AS tareas,
    COALESCE(( SELECT sum(vw_asignaciones.cantidad_pendiente) AS sum
           FROM vw_asignaciones
          WHERE vw_asignaciones.id_reproceso::text = r.id_reproceso::text), 0::bigint)::integer AS pendiente,
    COALESCE(( SELECT sum(vw_reproceso_faltantes.cantidad - vw_reproceso_faltantes.asignado) AS sum
           FROM vw_reproceso_faltantes
          WHERE vw_reproceso_faltantes.id_reproceso::text = r.id_reproceso::text), 0::bigint)::integer AS sin_asignar,
        CASE
            WHEN r.estado::text = 'Cancelado'::text THEN 'Cancelado'::text
            WHEN NOT (EXISTS ( SELECT 1
               FROM tb_detalle_de_produccion
              WHERE tb_detalle_de_produccion.id_reproceso::text = r.id_reproceso::text)) THEN 'Por asignar'::text
            WHEN (EXISTS ( SELECT 1
               FROM vw_reproceso_faltantes
              WHERE vw_reproceso_faltantes.id_reproceso::text = r.id_reproceso::text)) OR (EXISTS ( SELECT 1
               FROM vw_asignaciones
              WHERE vw_asignaciones.id_reproceso::text = r.id_reproceso::text AND vw_asignaciones.cantidad_pendiente > 0)) THEN 'En curso'::text
            ELSE 'Terminado'::text
        END AS situacion
   FROM tb_reproceso r
     LEFT JOIN empleados e ON e.id_empleados::text = r.creado_por::text;

-- vw_seguimiento_produccion
 SELECT s.id_seguimiento_produccion,
    s.id_produccion,
    p.id_remision,
    s.estado_anterior,
    s.estado_nuevo,
    COALESCE(e.nombre, 'Sistema'::character varying) AS responsable,
    'Empleado'::text AS tipo_responsable,
    s.fecha_hora
   FROM tb_seguimiento_produccion s
     JOIN tb_produccion p ON p.id_produccion::text = s.id_produccion::text
     LEFT JOIN empleados e ON e.id_empleados::text = s.responsable_empleado::text;

-- vw_seguimiento_remision
 SELECT s.id_seguimiento,
    s.id_remision,
    s.estado_anterior,
    s.estado_nuevo,
    COALESCE(e.nombre, c.nombre) AS responsable,
        CASE
            WHEN s.responsable_empleado IS NOT NULL THEN 'Empleado'::text
            ELSE 'Cliente'::text
        END AS tipo_responsable,
    s.fecha_hora
   FROM tb_seguimiento_remision s
     LEFT JOIN empleados e ON e.id_empleados::text = s.responsable_empleado::text
     LEFT JOIN tb_clientes c ON c.nit::text = s.responsable_cliente::text;

-- vw_terminadas_por_talla
 WITH requeridos AS (
         SELECT p.id_produccion,
            ''::character varying AS grupo,
            dr_1.id_detalle_de_remision,
            dr_1.cantidad,
            ps.id_paso
           FROM tb_produccion p
             JOIN tb_detalle_rem dr_1 ON dr_1.id_remision::text = p.id_remision::text
             JOIN tb_pasos_produccion ps ON ps.id_produccion::text = p.id_produccion::text AND ps.id_reproceso IS NULL
        UNION ALL
         SELECT r.id_produccion,
            r.id_reproceso,
            rt.id_detalle_de_remision,
            rt.cantidad,
            ps.id_paso
           FROM tb_reproceso r
             JOIN tb_reproceso_talla rt ON rt.id_reproceso::text = r.id_reproceso::text
             JOIN tb_pasos_produccion ps ON ps.id_reproceso::text = r.id_reproceso::text
          WHERE r.estado::text <> 'Cancelado'::text
        ), por_pieza AS (
         SELECT d.id_produccion,
            COALESCE(d.id_reproceso, ''::character varying) AS grupo,
            d.id_detalle_de_remision,
            d.id_paso,
            d.id_tipo_pieza,
            sum(a.cantidad_realizada) AS realizado
           FROM tb_detalle_de_produccion d
             JOIN vw_asignaciones a USING (id_detalle_de_produccion)
          WHERE d.id_paso IS NOT NULL
          GROUP BY d.id_produccion, (COALESCE(d.id_reproceso, ''::character varying)), d.id_detalle_de_remision, d.id_paso, d.id_tipo_pieza
        ), por_paso AS (
         SELECT por_pieza.id_produccion,
            por_pieza.grupo,
            por_pieza.id_detalle_de_remision,
            por_pieza.id_paso,
            min(por_pieza.realizado) AS realizado
           FROM por_pieza
          GROUP BY por_pieza.id_produccion, por_pieza.grupo, por_pieza.id_detalle_de_remision, por_pieza.id_paso
        ), por_grupo AS (
         SELECT r.id_produccion,
            r.grupo,
            r.id_detalle_de_remision,
            LEAST(min(COALESCE(pp.realizado, 0::bigint)), r.cantidad::bigint)::integer AS terminadas
           FROM requeridos r
             LEFT JOIN por_paso pp USING (id_produccion, grupo, id_detalle_de_remision, id_paso)
          GROUP BY r.id_produccion, r.grupo, r.id_detalle_de_remision, r.cantidad
        )
 SELECT g.id_produccion,
    g.id_detalle_de_remision,
    LEAST(sum(g.terminadas), dr.cantidad::bigint)::integer AS terminadas,
    COALESCE(sum(g.terminadas) FILTER (WHERE g.grupo::text <> ''::text), 0::bigint)::integer AS recuperadas
   FROM por_grupo g
     JOIN tb_detalle_rem dr ON dr.id_detalle_de_remision::text = g.id_detalle_de_remision::text
  GROUP BY g.id_produccion, g.id_detalle_de_remision, dr.cantidad;

-- vw_ventas
 SELECT en.id_entrega,
    en.fecha_finalizacion,
    en.id_remision,
    c.nit,
    c.nombre AS cliente,
    en.cantidad_entregada,
    en.precio_total,
    en.estado
   FROM tb_remision_entrega en
     JOIN tb_remision r ON r.id_remision::text = en.id_remision::text
     JOIN tb_clientes c ON c.nit::text = r.nit_cliente::text;

-- ======================================================================
-- TRIGGERS
-- ======================================================================

-- empleados.trg_empleado_rol_activo
CREATE TRIGGER trg_empleado_rol_activo BEFORE INSERT OR UPDATE OF id_rol ON public.empleados FOR EACH ROW EXECUTE FUNCTION fn_validar_rol_activo()

-- empleados.trg_empleados_no_eliminar
CREATE TRIGGER trg_empleados_no_eliminar BEFORE DELETE ON public.empleados FOR EACH ROW EXECUTE FUNCTION fn_empleados_no_eliminar()

-- roles.trg_proteger_rol
CREATE TRIGGER trg_proteger_rol BEFORE DELETE OR UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION fn_proteger_rol()

-- tb_asistencia.trg_asistencia_validar
CREATE TRIGGER trg_asistencia_validar BEFORE INSERT OR UPDATE ON public.tb_asistencia FOR EACH ROW EXECUTE FUNCTION fn_asistencia_validar()

-- tb_asistencia_marcacion.trg_marcacion_sincronizar
CREATE TRIGGER trg_marcacion_sincronizar AFTER INSERT OR DELETE OR UPDATE ON public.tb_asistencia_marcacion FOR EACH ROW EXECUTE FUNCTION fn_marcacion_sincronizar()

-- tb_asistencia_marcacion.trg_marcacion_validar
CREATE TRIGGER trg_marcacion_validar BEFORE INSERT OR UPDATE ON public.tb_asistencia_marcacion FOR EACH ROW EXECUTE FUNCTION fn_marcacion_validar()

-- tb_clientes.trg_cliente_rol_activo
CREATE TRIGGER trg_cliente_rol_activo BEFORE INSERT OR UPDATE OF id_rol ON public.tb_clientes FOR EACH ROW EXECUTE FUNCTION fn_validar_rol_activo()

-- tb_compras.trg_compra_proveedor_activo
CREATE TRIGGER trg_compra_proveedor_activo BEFORE INSERT OR UPDATE OF id_proveedor ON public.tb_compras FOR EACH ROW EXECUTE FUNCTION fn_validar_proveedor_activo()

-- tb_detalle_compras.trg_detalle_compra_stock
CREATE TRIGGER trg_detalle_compra_stock AFTER INSERT OR DELETE OR UPDATE ON public.tb_detalle_compras FOR EACH ROW EXECUTE FUNCTION fn_detalle_compra_stock()

-- tb_detalle_de_produccion.trg_detalle_produccion_stock
CREATE TRIGGER trg_detalle_produccion_stock AFTER INSERT OR DELETE OR UPDATE ON public.tb_detalle_de_produccion FOR EACH ROW EXECUTE FUNCTION fn_detalle_produccion_stock()

-- tb_detalle_de_produccion.trg_detalle_produccion_validar
CREATE TRIGGER trg_detalle_produccion_validar BEFORE INSERT OR DELETE OR UPDATE ON public.tb_detalle_de_produccion FOR EACH ROW EXECUTE FUNCTION fn_detalle_produccion_validar()

-- tb_detalle_de_produccion.trg_tarea_editar_validar
CREATE TRIGGER trg_tarea_editar_validar BEFORE DELETE OR UPDATE ON public.tb_detalle_de_produccion FOR EACH ROW EXECUTE FUNCTION fn_tarea_editar_validar()

-- tb_detalle_rem.trg_detalle_rem_total
CREATE TRIGGER trg_detalle_rem_total AFTER INSERT OR DELETE OR UPDATE ON public.tb_detalle_rem FOR EACH ROW EXECUTE FUNCTION fn_detalle_rem_total()

-- tb_detalle_rem.trg_detalle_rem_validar
CREATE TRIGGER trg_detalle_rem_validar BEFORE INSERT OR DELETE OR UPDATE ON public.tb_detalle_rem FOR EACH ROW EXECUTE FUNCTION fn_detalle_rem_validar()

-- tb_insumos_enviados_x_cliente.trg_iec_antes
CREATE TRIGGER trg_iec_antes BEFORE INSERT OR UPDATE ON public.tb_insumos_enviados_x_cliente FOR EACH ROW EXECUTE FUNCTION fn_iec_antes()

-- tb_insumos_enviados_x_cliente.trg_iec_marcar_remision
CREATE TRIGGER trg_iec_marcar_remision AFTER INSERT ON public.tb_insumos_enviados_x_cliente FOR EACH ROW EXECUTE FUNCTION fn_iec_marcar_remision()

-- tb_pasos_produccion.trg_paso_produccion_validar
CREATE TRIGGER trg_paso_produccion_validar BEFORE INSERT OR DELETE OR UPDATE ON public.tb_pasos_produccion FOR EACH ROW EXECUTE FUNCTION fn_paso_produccion_validar()

-- tb_produccion.trg_produccion_antes
CREATE TRIGGER trg_produccion_antes BEFORE INSERT OR UPDATE ON public.tb_produccion FOR EACH ROW EXECUTE FUNCTION fn_produccion_antes()

-- tb_produccion.trg_produccion_despues
CREATE TRIGGER trg_produccion_despues AFTER INSERT OR UPDATE OF estado ON public.tb_produccion FOR EACH ROW EXECUTE FUNCTION fn_produccion_despues()

-- tb_registro_diario.trg_registro_diario_validar
CREATE TRIGGER trg_registro_diario_validar BEFORE INSERT OR DELETE OR UPDATE ON public.tb_registro_diario FOR EACH ROW EXECUTE FUNCTION fn_registro_diario_validar()

-- tb_remision.trg_seguimiento_remision
CREATE TRIGGER trg_seguimiento_remision AFTER INSERT OR UPDATE OF estado ON public.tb_remision FOR EACH ROW EXECUTE FUNCTION fn_seguimiento_remision()

-- tb_remision.trg_tras_aprobar_remision
CREATE TRIGGER trg_tras_aprobar_remision AFTER UPDATE OF estado ON public.tb_remision FOR EACH ROW EXECUTE FUNCTION fn_tras_aprobar_remision()

-- tb_remision.trg_validar_estado_remision
CREATE TRIGGER trg_validar_estado_remision BEFORE INSERT OR UPDATE ON public.tb_remision FOR EACH ROW EXECUTE FUNCTION fn_validar_estado_remision()

-- tb_remision_entrega.trg_entrega_cerrar_remision
CREATE TRIGGER trg_entrega_cerrar_remision AFTER INSERT OR UPDATE ON public.tb_remision_entrega FOR EACH ROW EXECUTE FUNCTION fn_entrega_cerrar_remision()

-- tb_remision_entrega.trg_entrega_validar
CREATE TRIGGER trg_entrega_validar BEFORE INSERT OR UPDATE ON public.tb_remision_entrega FOR EACH ROW EXECUTE FUNCTION fn_entrega_validar()

-- tb_reproceso.trg_reproceso_cancelado
CREATE TRIGGER trg_reproceso_cancelado AFTER UPDATE OF estado ON public.tb_reproceso FOR EACH ROW EXECUTE FUNCTION fn_reproceso_cancelado()

-- tb_reproceso.trg_reproceso_validar
CREATE TRIGGER trg_reproceso_validar BEFORE INSERT OR UPDATE ON public.tb_reproceso FOR EACH ROW EXECUTE FUNCTION fn_reproceso_validar()

-- tb_reproceso_talla.trg_reproceso_talla_validar
CREATE TRIGGER trg_reproceso_talla_validar BEFORE INSERT OR DELETE OR UPDATE ON public.tb_reproceso_talla FOR EACH ROW EXECUTE FUNCTION fn_reproceso_talla_validar()

-- tb_seguimiento_produccion.trg_seguimiento_produccion_inmutable
CREATE TRIGGER trg_seguimiento_produccion_inmutable BEFORE UPDATE ON public.tb_seguimiento_produccion FOR EACH ROW EXECUTE FUNCTION fn_seguimiento_inmutable()

-- tb_seguimiento_remision.trg_seguimiento_inmutable
CREATE TRIGGER trg_seguimiento_inmutable BEFORE UPDATE ON public.tb_seguimiento_remision FOR EACH ROW EXECUTE FUNCTION fn_seguimiento_inmutable()

-- ======================================================================
-- FUNCIONES
-- ======================================================================

-- fn_abrir_asistencia
CREATE OR REPLACE FUNCTION public.fn_abrir_asistencia(p_fecha date)
 RETURNS void
 LANGUAGE sql
AS $function$
    INSERT INTO tb_asistencia (id_empleado, fecha, estado)
    SELECT e.id_empleados, p_fecha, 'No presente'
      FROM empleados e
     WHERE e.estado = 'Activo'
    ON CONFLICT (id_empleado, fecha) DO NOTHING;
$function$


-- fn_asistencia_validar
CREATE OR REPLACE FUNCTION public.fn_asistencia_validar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.fecha > fn_hoy() THEN
        RAISE EXCEPTION 'No se puede registrar asistencia de un día futuro.';
    END IF;
    NEW.observacion := NULLIF(btrim(NEW.observacion), '');
    IF TG_OP = 'UPDATE' THEN
        NEW.fecha_registro := now();
        IF NEW.estado IS DISTINCT FROM OLD.estado THEN
            IF NEW.estado = 'Presente' AND NOT EXISTS (
                SELECT 1 FROM tb_asistencia_marcacion WHERE id_asistencia = NEW.id_asistencia) THEN
                RAISE EXCEPTION 'Para marcar Presente registre la hora de entrada.';
            END IF;
            IF NEW.estado <> 'Presente' AND EXISTS (
                SELECT 1 FROM tb_asistencia_marcacion WHERE id_asistencia = NEW.id_asistencia) THEN
                RAISE EXCEPTION 'Ese día ya tiene horas registradas: elimínelas antes de marcarlo como %.', NEW.estado;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END $function$


-- fn_detalle_compra_stock
CREATE OR REPLACE FUNCTION public.fn_detalle_compra_stock()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Revertir lo anterior
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        UPDATE tb_insumos SET stock = stock - OLD.cantidad
         WHERE id_insumos = OLD.id_insumos AND stock >= OLD.cantidad;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'No se puede modificar la compra: el insumo % ya no tiene ese stock (fue usado).', OLD.id_insumos;
        END IF;
    END IF;
    -- Aplicar lo nuevo
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        UPDATE tb_insumos SET stock = stock + NEW.cantidad WHERE id_insumos = NEW.id_insumos;
    END IF;
    -- Recalcular total de la(s) compra(s)
    UPDATE tb_compras c
       SET total_compra = COALESCE((SELECT sum(subtotal) FROM tb_detalle_compras d
                                     WHERE d.id_compras = c.id_compras), 0)
     WHERE c.id_compras IN (COALESCE(NEW.id_compras, OLD.id_compras), COALESCE(OLD.id_compras, NEW.id_compras));
    RETURN NULL;
END $function$


-- fn_detalle_produccion_stock
CREATE OR REPLACE FUNCTION public.fn_detalle_produccion_stock()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        IF OLD.id_insumos IS NOT NULL THEN
            UPDATE tb_insumos SET stock = stock + OLD.cantidad_insumo WHERE id_insumos = OLD.id_insumos;
        ELSIF OLD.id_insumos_enviados_x_cliente IS NOT NULL THEN
            UPDATE tb_insumos_enviados_x_cliente
               SET cantidad_disponible = cantidad_disponible + OLD.cantidad_insumo
             WHERE id_insumo_enviado = OLD.id_insumos_enviados_x_cliente;
        END IF;
    END IF;

    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        IF NEW.id_insumos IS NOT NULL THEN
            UPDATE tb_insumos SET stock = stock - NEW.cantidad_insumo
             WHERE id_insumos = NEW.id_insumos AND stock >= NEW.cantidad_insumo;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Stock insuficiente del insumo % para asignar % unidades.', NEW.id_insumos, NEW.cantidad_insumo;
            END IF;
        ELSIF NEW.id_insumos_enviados_x_cliente IS NOT NULL THEN
            UPDATE tb_insumos_enviados_x_cliente
               SET cantidad_disponible = cantidad_disponible - NEW.cantidad_insumo
             WHERE id_insumo_enviado = NEW.id_insumos_enviados_x_cliente
               AND cantidad_disponible >= NEW.cantidad_insumo;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Cantidad insuficiente del insumo enviado % para asignar % unidades.',
                    NEW.id_insumos_enviados_x_cliente, NEW.cantidad_insumo;
            END IF;
        END IF;
    END IF;
    RETURN NULL;
END $function$


-- fn_detalle_produccion_validar
CREATE OR REPLACE FUNCTION public.fn_detalle_produccion_validar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_remision     VARCHAR;
    v_estado_prod  VARCHAR;
    v_cant_pieza   INT;
    v_ya_asignado  INT;
    v_ocupada      RECORD;
    v_paso         RECORD;
    v_asis         RECORD;
BEGIN
    IF TG_OP = 'DELETE' THEN
        SELECT estado INTO v_estado_prod FROM tb_produccion WHERE id_produccion = OLD.id_produccion;
        IF v_estado_prod = 'Finalizada' THEN
            RAISE EXCEPTION 'No se pueden borrar asignaciones de una producción Finalizada.';
        END IF;
        RETURN OLD;
    END IF;

    SELECT id_remision, estado INTO v_remision, v_estado_prod
      FROM tb_produccion WHERE id_produccion = NEW.id_produccion;

    IF v_estado_prod NOT IN ('Por asignar', 'En producción') THEN
        RAISE EXCEPTION 'La producción está Finalizada: no se pueden asignar ni editar tareas.';
    END IF;

    -- El paso define el proceso de la tarea (y si es de un reproceso)
    SELECT p.id_paso, p.id_proceso, p.id_reproceso, pr.nombre, pr.estado INTO v_paso
      FROM tb_pasos_produccion p JOIN tb_procesos pr ON pr.id_proceso = p.id_proceso
     WHERE p.id_paso = NEW.id_paso AND p.id_produccion = NEW.id_produccion;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Elija uno de los pasos de la producción % para la tarea.', NEW.id_produccion;
    END IF;
    IF v_paso.estado <> 'Activo' THEN
        RAISE EXCEPTION 'El proceso % está inactivo.', v_paso.nombre;
    END IF;
    NEW.id_proceso := v_paso.id_proceso;
    NEW.id_reproceso := v_paso.id_reproceso;

    IF NOT EXISTS (SELECT 1 FROM empleados WHERE id_empleados = NEW.id_empleado AND estado = 'Activo') THEN
        RAISE EXCEPTION 'El empleado % no existe o está inactivo.', NEW.id_empleado;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM tipo_de_pieza WHERE id_tipo_de_pieza = NEW.id_tipo_pieza AND estado = 'Activo') THEN
        RAISE EXCEPTION 'El tipo de pieza % no existe o está inactivo.', NEW.id_tipo_pieza;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM tipo_de_maquina WHERE id_tipo_de_maquina = NEW.id_tipo_maquina AND estado = 'Activo') THEN
        RAISE EXCEPTION 'La máquina % no existe o está inactiva.', NEW.id_tipo_maquina;
    END IF;

    -- El empleado debe estar en el taller ahora (solo al asignarle una tarea nueva o cambiar de empleado)
    IF TG_OP = 'INSERT' OR NEW.id_empleado IS DISTINCT FROM OLD.id_empleado THEN
        SELECT estado, en_taller INTO v_asis FROM vw_asistencia
         WHERE id_empleado = NEW.id_empleado AND fecha = fn_hoy();
        IF NOT COALESCE(v_asis.en_taller, FALSE) THEN
            IF v_asis.estado = 'Presente' THEN
                RAISE EXCEPTION 'El empleado no está en el taller en este momento (salió y no ha vuelto): no se le pueden asignar tareas.';
            END IF;
            RAISE EXCEPTION 'El empleado no tiene entrada registrada hoy en la asistencia (%): no se le pueden asignar tareas.',
                COALESCE(v_asis.estado, 'No presente');
        END IF;
    END IF;

    -- La máquina debe servir para el proceso (si el proceso tiene máquinas configuradas)
    IF EXISTS (SELECT 1 FROM tb_proceso_x_maquina WHERE id_proceso = NEW.id_proceso)
       AND NOT EXISTS (SELECT 1 FROM tb_proceso_x_maquina
                        WHERE id_proceso = NEW.id_proceso AND id_maquina = NEW.id_tipo_maquina) THEN
        RAISE EXCEPTION 'Esa máquina no sirve para el proceso %. Elija una de las máquinas de ese proceso.', v_paso.nombre;
    END IF;

    -- La máquina no puede estar ocupada por otra tarea con unidades pendientes
    SELECT a.id_detalle_de_produccion, a.empleado, a.id_produccion INTO v_ocupada
      FROM tb_detalle_de_produccion d
      JOIN vw_asignaciones a ON a.id_detalle_de_produccion = d.id_detalle_de_produccion
     WHERE d.id_tipo_maquina = NEW.id_tipo_maquina
       AND d.id_detalle_de_produccion <> NEW.id_detalle_de_produccion
       AND a.estado_produccion <> 'Finalizada'
       AND a.cantidad_pendiente > 0
     LIMIT 1;
    IF FOUND THEN
        RAISE EXCEPTION 'La máquina está ocupada por % (tarea %, producción %). Elija otra o espere a que termine.',
            v_ocupada.empleado, v_ocupada.id_detalle_de_produccion, v_ocupada.id_produccion;
    END IF;

    -- El empleado tampoco puede tener otra tarea con unidades pendientes
    SELECT a.id_detalle_de_produccion, a.id_produccion, a.cantidad_pendiente INTO v_ocupada
      FROM vw_asignaciones a
     WHERE a.id_empleado = NEW.id_empleado
       AND a.id_detalle_de_produccion <> NEW.id_detalle_de_produccion
       AND a.estado_produccion <> 'Finalizada'
       AND a.cantidad_pendiente > 0
     LIMIT 1;
    IF FOUND THEN
        RAISE EXCEPTION 'El empleado está ocupado: tiene % unidades pendientes en la tarea % (producción %). Asígnele otra cuando termine.',
            v_ocupada.cantidad_pendiente, v_ocupada.id_detalle_de_produccion, v_ocupada.id_produccion;
    END IF;

    -- La línea de la remisión (prenda + talla) debe ser de la misma remisión
    SELECT cantidad INTO v_cant_pieza FROM tb_detalle_rem
     WHERE id_detalle_de_remision = NEW.id_detalle_de_remision AND id_remision = v_remision;
    IF v_cant_pieza IS NULL THEN
        RAISE EXCEPTION 'El detalle de remisión % no pertenece a la remisión %.', NEW.id_detalle_de_remision, v_remision;
    END IF;

    -- En un reproceso, el tope de la talla es lo que se va a reprocesar
    IF NEW.id_reproceso IS NOT NULL THEN
        SELECT rt.cantidad INTO v_cant_pieza
          FROM tb_reproceso_talla rt JOIN tb_reproceso r ON r.id_reproceso = rt.id_reproceso
         WHERE rt.id_reproceso = NEW.id_reproceso AND rt.id_detalle_de_remision = NEW.id_detalle_de_remision
           AND r.estado = 'Abierto';
        IF v_cant_pieza IS NULL THEN
            RAISE EXCEPTION 'Esa talla no está en el reproceso (o el reproceso fue cancelado).';
        END IF;
    END IF;

    -- No asignar más unidades que las de la talla para el mismo paso y pieza
    SELECT COALESCE(sum(cantidad_asignada), 0) INTO v_ya_asignado
      FROM tb_detalle_de_produccion
     WHERE id_detalle_de_remision = NEW.id_detalle_de_remision
       AND id_paso = NEW.id_paso
       AND id_tipo_pieza = NEW.id_tipo_pieza
       AND id_detalle_de_produccion <> NEW.id_detalle_de_produccion;
    IF v_ya_asignado + NEW.cantidad_asignada > v_cant_pieza THEN
        RAISE EXCEPTION 'Se exceden las unidades de esa talla para ese paso y pieza: % %, ya asignadas %, intenta asignar %.',
            CASE WHEN NEW.id_reproceso IS NULL THEN 'pedidas' ELSE 'a reprocesar' END,
            v_cant_pieza, v_ya_asignado, NEW.cantidad_asignada;
    END IF;

    -- Insumo del cliente: debe ser de esta misma remisión
    IF NEW.id_insumos_enviados_x_cliente IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM tb_insumos_enviados_x_cliente
         WHERE id_insumo_enviado = NEW.id_insumos_enviados_x_cliente AND id_remision = v_remision) THEN
        RAISE EXCEPTION 'El insumo enviado % no pertenece a la remisión %.', NEW.id_insumos_enviados_x_cliente, v_remision;
    END IF;

    -- Insumo del taller: debe estar activo
    IF NEW.id_insumos IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM tb_insumos WHERE id_insumos = NEW.id_insumos AND estado = 'Activo') THEN
        RAISE EXCEPTION 'El insumo % no existe o está inactivo.', NEW.id_insumos;
    END IF;

    RETURN NEW;
END $function$


-- fn_detalle_rem_total
CREATE OR REPLACE FUNCTION public.fn_detalle_rem_total()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE tb_remision r
       SET total_prendas = COALESCE((SELECT sum(cantidad) FROM tb_detalle_rem d
                                      WHERE d.id_remision = r.id_remision), 0)
     WHERE r.id_remision IN (COALESCE(NEW.id_remision, OLD.id_remision), COALESCE(OLD.id_remision, NEW.id_remision));
    RETURN NULL;
END $function$


-- fn_detalle_rem_validar
CREATE OR REPLACE FUNCTION public.fn_detalle_rem_validar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_estado VARCHAR;
BEGIN
    SELECT estado INTO v_estado FROM tb_remision
     WHERE id_remision = COALESCE(NEW.id_remision, OLD.id_remision);
    -- v_estado es NULL cuando se borra la remisión completa (cascada)
    IF v_estado IS NOT NULL AND v_estado <> 'Pendiente' THEN
        RAISE EXCEPTION 'El detalle solo se puede modificar mientras la remisión está Pendiente (actual: %).', v_estado;
    END IF;
    RETURN COALESCE(NEW, OLD);
END $function$


-- fn_empleado_sesion
CREATE OR REPLACE FUNCTION public.fn_empleado_sesion()
 RETURNS character varying
 LANGUAGE sql
 STABLE
AS $function$
    SELECT nullif(current_setting('eslabon.id_empleado', true), '')::VARCHAR;
$function$


-- fn_empleados_no_eliminar
CREATE OR REPLACE FUNCTION public.fn_empleados_no_eliminar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    RAISE EXCEPTION 'Los empleados no se pueden eliminar (su histórico se conserva). Cambie su estado a Inactivo.';
END;
$function$


-- fn_entrega_cerrar_remision
CREATE OR REPLACE FUNCTION public.fn_entrega_cerrar_remision()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE tb_remision r SET estado = 'Entregada'
     WHERE r.id_remision = NEW.id_remision
       AND r.estado = 'Terminada'
       AND (SELECT sum(cantidad_entregada) FROM tb_remision_entrega e
             WHERE e.id_remision = r.id_remision) >= r.total_prendas;
    RETURN NULL;
END $function$


-- fn_entrega_validar
CREATE OR REPLACE FUNCTION public.fn_entrega_validar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_estado     VARCHAR;
    v_total      INT;
    v_costo      DECIMAL(10,2);
    v_entregado  INT;
BEGIN
    SELECT estado, total_prendas, costo_prenda INTO v_estado, v_total, v_costo
      FROM tb_remision WHERE id_remision = NEW.id_remision;

    IF TG_OP = 'INSERT' AND v_estado <> 'Terminada' THEN
        RAISE EXCEPTION 'Solo se registran entregas de remisiones Terminadas (actual: %).', v_estado;
    END IF;

    SELECT COALESCE(sum(cantidad_entregada), 0) INTO v_entregado
      FROM tb_remision_entrega
     WHERE id_remision = NEW.id_remision AND id_entrega <> NEW.id_entrega;

    IF v_entregado + NEW.cantidad_entregada > v_total THEN
        RAISE EXCEPTION 'Se exceden las prendas de la remisión: total %, ya entregadas %, intenta entregar %.',
            v_total, v_entregado, NEW.cantidad_entregada;
    END IF;

    NEW.precio_total := COALESCE(NEW.precio_total, NEW.cantidad_entregada * v_costo);
    RETURN NEW;
END $function$


-- fn_generar_id
CREATE OR REPLACE FUNCTION public.fn_generar_id(p_prefijo text, p_secuencia regclass)
 RETURNS character varying
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_n BIGINT := nextval(p_secuencia);
BEGIN
    RETURN p_prefijo || lpad(v_n::TEXT, greatest(5, length(v_n::TEXT)), '0');
END $function$


-- fn_hoy
CREATE OR REPLACE FUNCTION public.fn_hoy()
 RETURNS date
 LANGUAGE sql
 STABLE
AS $function$
    SELECT (now() AT TIME ZONE 'America/Bogota')::date;
$function$


-- fn_iec_antes
CREATE OR REPLACE FUNCTION public.fn_iec_antes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.cantidad_disponible := COALESCE(NEW.cantidad_disponible, NEW.cantidad);
    END IF;
    IF NEW.cantidad_disponible > NEW.cantidad THEN
        RAISE EXCEPTION 'La cantidad disponible no puede superar la cantidad enviada.';
    END IF;
    RETURN NEW;
END $function$


-- fn_iec_marcar_remision
CREATE OR REPLACE FUNCTION public.fn_iec_marcar_remision()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE tb_remision SET insumos_enviados = TRUE
     WHERE id_remision = NEW.id_remision AND NOT insumos_enviados;
    RETURN NULL;
END $function$


-- fn_marcacion_sincronizar
CREATE OR REPLACE FUNCTION public.fn_marcacion_sincronizar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_id VARCHAR := COALESCE(NEW.id_asistencia, OLD.id_asistencia);
BEGIN
    IF EXISTS (SELECT 1 FROM tb_asistencia_marcacion WHERE id_asistencia = v_id) THEN
        UPDATE tb_asistencia SET estado = 'Presente'
         WHERE id_asistencia = v_id AND estado <> 'Presente';
    ELSE
        UPDATE tb_asistencia SET estado = 'No presente'
         WHERE id_asistencia = v_id AND estado = 'Presente';
    END IF;
    RETURN NULL;
END $function$


-- fn_marcacion_validar
CREATE OR REPLACE FUNCTION public.fn_marcacion_validar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_asis    RECORD;
    v_choque  RECORD;
BEGIN
    SELECT a.fecha, a.estado, e.nombre INTO v_asis
      FROM tb_asistencia a JOIN empleados e ON e.id_empleados = a.id_empleado
     WHERE a.id_asistencia = NEW.id_asistencia;

    IF v_asis.estado IN ('Permiso', 'Incapacidad', 'Vacaciones') THEN
        RAISE EXCEPTION '% tiene el día marcado como %: quite esa novedad antes de registrar horas.',
            v_asis.nombre, v_asis.estado;
    END IF;

    -- Las horas deben ser del mismo día de la asistencia (hora de Colombia) y no futuras
    IF (NEW.hora_entrada AT TIME ZONE 'America/Bogota')::date <> v_asis.fecha THEN
        RAISE EXCEPTION 'La hora de entrada debe ser del %.', to_char(v_asis.fecha, 'DD/MM/YYYY');
    END IF;
    IF NEW.hora_salida IS NOT NULL AND (NEW.hora_salida AT TIME ZONE 'America/Bogota')::date <> v_asis.fecha THEN
        RAISE EXCEPTION 'La hora de salida debe ser del mismo día (%).', to_char(v_asis.fecha, 'DD/MM/YYYY');
    END IF;
    IF NEW.hora_entrada > now() + interval '1 minute'
       OR (NEW.hora_salida IS NOT NULL AND NEW.hora_salida > now() + interval '1 minute') THEN
        RAISE EXCEPTION 'No se pueden registrar horas que todavía no han pasado.';
    END IF;
    IF NEW.hora_salida IS NOT NULL AND NEW.hora_salida <= NEW.hora_entrada THEN
        RAISE EXCEPTION 'La hora de salida debe ser después de la hora de entrada.';
    END IF;

    -- Una salida por permiso lleva motivo
    NEW.motivo := NULLIF(btrim(NEW.motivo), '');
    IF NEW.tipo_salida = 'Permiso' AND NEW.motivo IS NULL THEN
        RAISE EXCEPTION 'Escriba el motivo del permiso (ej. cita médica).';
    END IF;

    -- Los tramos del día no se pueden cruzar (un tramo sin salida va "hasta ahora")
    SELECT m.id_marcacion,
           to_char(m.hora_entrada AT TIME ZONE 'America/Bogota', 'HH24:MI') AS entrada,
           COALESCE(to_char(m.hora_salida AT TIME ZONE 'America/Bogota', 'HH24:MI'), 'sin salida') AS salida
      INTO v_choque
      FROM tb_asistencia_marcacion m
     WHERE m.id_asistencia = NEW.id_asistencia
       AND m.id_marcacion <> NEW.id_marcacion
       AND tstzrange(m.hora_entrada, COALESCE(m.hora_salida, 'infinity'::timestamptz))
           && tstzrange(NEW.hora_entrada, COALESCE(NEW.hora_salida, 'infinity'::timestamptz))
     LIMIT 1;
    IF FOUND THEN
        IF v_choque.salida = 'sin salida' THEN
            RAISE EXCEPTION '% todavía está en el taller desde las % (sin salida): registre primero la salida.',
                v_asis.nombre, v_choque.entrada;
        END IF;
        RAISE EXCEPTION 'Ese horario se cruza con otro tramo del mismo día (% a %).', v_choque.entrada, v_choque.salida;
    END IF;

    RETURN NEW;
END $function$


-- fn_paso_produccion_validar
CREATE OR REPLACE FUNCTION public.fn_paso_produccion_validar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_estado VARCHAR;
BEGIN
    SELECT estado INTO v_estado FROM tb_produccion WHERE id_produccion = COALESCE(NEW.id_produccion, OLD.id_produccion);
    -- v_estado es NULL cuando se borra la producción completa (cascada)
    IF v_estado = 'Finalizada' THEN
        RAISE EXCEPTION 'La producción está Finalizada: no se pueden cambiar sus pasos.';
    END IF;
    IF TG_OP = 'UPDATE' AND (NEW.id_produccion <> OLD.id_produccion OR NEW.id_proceso <> OLD.id_proceso
                             OR NEW.id_reproceso IS DISTINCT FROM OLD.id_reproceso) THEN
        RAISE EXCEPTION 'Solo se puede cambiar la descripción del paso. Para otro proceso, agregue un paso nuevo.';
    END IF;
    IF TG_OP = 'DELETE' AND v_estado IS NOT NULL
       AND EXISTS (SELECT 1 FROM tb_detalle_de_produccion WHERE id_paso = OLD.id_paso) THEN
        RAISE EXCEPTION 'No se puede quitar el paso: ya tiene tareas asignadas. Elimine primero esas tareas.';
    END IF;
    IF TG_OP = 'INSERT' AND NOT EXISTS (
        SELECT 1 FROM tb_procesos WHERE id_proceso = NEW.id_proceso AND estado = 'Activo') THEN
        RAISE EXCEPTION 'El proceso % no existe o está inactivo.', NEW.id_proceso;
    END IF;
    IF TG_OP = 'INSERT' AND NEW.id_reproceso IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM tb_reproceso WHERE id_reproceso = NEW.id_reproceso
                                     AND id_produccion = NEW.id_produccion AND estado = 'Abierto') THEN
        RAISE EXCEPTION 'El reproceso % no está abierto en la producción %.', NEW.id_reproceso, NEW.id_produccion;
    END IF;
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        NEW.descripcion := NULLIF(btrim(NEW.descripcion), '');
    END IF;
    RETURN COALESCE(NEW, OLD);
END $function$


-- fn_produccion_antes
CREATE OR REPLACE FUNCTION public.fn_produccion_antes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_pendiente INT;
    v_falta     RECORD;
    v_rep       RECORD;
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.estado <> 'Por asignar' THEN
            RAISE EXCEPTION 'Una producción nueva debe iniciar en estado Por asignar.';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM tb_remision
                       WHERE id_remision = NEW.id_remision AND estado = 'Aprobada') THEN
            RAISE EXCEPTION 'Solo se puede enviar a producir una remisión en estado Aprobada.';
        END IF;
        NEW.fecha_estado := now();
        RETURN NEW;
    END IF;

    IF NEW.id_remision <> OLD.id_remision THEN
        RAISE EXCEPTION 'No se puede cambiar la remisión de una producción.';
    END IF;

    IF NEW.estado IS DISTINCT FROM OLD.estado THEN
        IF NOT (
            (OLD.estado = 'Por asignar'   AND NEW.estado = 'En producción') OR
            (OLD.estado = 'En producción' AND NEW.estado = 'Finalizada')
        ) THEN
            RAISE EXCEPTION 'Cambio de estado no permitido en la producción: % -> %', OLD.estado, NEW.estado;
        END IF;
        IF NEW.estado = 'En producción' THEN
            IF NOT EXISTS (SELECT 1 FROM tb_pasos_produccion WHERE id_produccion = NEW.id_produccion AND id_reproceso IS NULL) THEN
                RAISE EXCEPTION 'Elija los procesos de la producción antes de iniciarla.';
            END IF;
            -- Basta con una tarea: el resto se va asignando mientras avanza
            IF NOT EXISTS (SELECT 1 FROM tb_detalle_de_produccion WHERE id_produccion = NEW.id_produccion) THEN
                RAISE EXCEPTION 'Asigne al menos una tarea antes de iniciar la producción.';
            END IF;
        END IF;
        IF NEW.estado = 'Finalizada' THEN
            SELECT * INTO v_falta FROM vw_produccion_faltantes WHERE id_produccion = NEW.id_produccion LIMIT 1;
            IF FOUND THEN
                RAISE EXCEPTION 'No se puede finalizar: falta asignar % de % unidades de % talla % en el paso %.',
                    v_falta.cantidad - v_falta.asignado, v_falta.cantidad, v_falta.nombre_de_la_pieza,
                    v_falta.talla, v_falta.paso;
            END IF;
            SELECT numero, situacion INTO v_rep FROM vw_reprocesos
             WHERE id_produccion = NEW.id_produccion AND situacion IN ('Por asignar', 'En curso') LIMIT 1;
            IF FOUND THEN
                RAISE EXCEPTION 'No se puede finalizar: el reproceso #% está %. Termínelo o cancélelo primero.',
                    v_rep.numero, lower(v_rep.situacion);
            END IF;
            SELECT COALESCE(sum(cantidad_pendiente), 0) INTO v_pendiente
              FROM vw_asignaciones WHERE id_produccion = NEW.id_produccion;
            IF v_pendiente > 0 THEN
                RAISE EXCEPTION 'No se puede finalizar: faltan % unidades por reportar en las tareas.', v_pendiente;
            END IF;
            NEW.fecha_entrega := COALESCE(NEW.fecha_entrega, CURRENT_DATE);
            IF NEW.fecha_entrega < NEW.fecha_inicio THEN
                NEW.fecha_entrega := CURRENT_DATE;
            END IF;
        END IF;
        NEW.fecha_estado := now();
    END IF;
    RETURN NEW;
END $function$


-- fn_produccion_despues
CREATE OR REPLACE FUNCTION public.fn_produccion_despues()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_empleado VARCHAR := fn_empleado_sesion();
BEGIN
    IF TG_OP = 'INSERT' OR NEW.estado IS DISTINCT FROM OLD.estado THEN
        IF v_empleado IS NULL THEN
            RAISE EXCEPTION 'Falta el responsable del cambio de estado de la producción %.', NEW.id_produccion
                USING HINT = 'Ejecute antes en la misma transacción: SELECT set_config(''eslabon.id_empleado'', ''EMP00001'', true);';
        END IF;
        INSERT INTO tb_seguimiento_produccion (id_produccion, estado_anterior, estado_nuevo, responsable_empleado)
        VALUES (NEW.id_produccion, CASE WHEN TG_OP = 'UPDATE' THEN OLD.estado END, NEW.estado, v_empleado);
    END IF;

    IF TG_OP = 'INSERT' THEN
        UPDATE tb_remision SET estado = 'En producción' WHERE id_remision = NEW.id_remision;
    ELSIF NEW.estado = 'Finalizada' AND OLD.estado <> 'Finalizada' THEN
        UPDATE tb_remision SET estado = 'Terminada' WHERE id_remision = NEW.id_remision;
    END IF;
    RETURN NULL;
END $function$


-- fn_proteger_rol
CREATE OR REPLACE FUNCTION public.fn_proteger_rol()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.es_protegido THEN
            RAISE EXCEPTION 'El rol "%" está protegido y no se puede eliminar.', OLD.descripcion_rol;
        END IF;
        RETURN OLD;
    END IF;
    IF OLD.es_protegido AND (NEW.estado <> 'Activo' OR NOT NEW.es_protegido) THEN
        RAISE EXCEPTION 'El rol "%" está protegido: no se puede desactivar.', OLD.descripcion_rol;
    END IF;
    RETURN NEW;
END $function$


-- fn_registro_diario_validar
CREATE OR REPLACE FUNCTION public.fn_registro_diario_validar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_estado_prod VARCHAR;
    v_asignada    INT;
    v_reportado   INT;
    v_empleado    VARCHAR;
BEGIN
    IF TG_OP = 'DELETE' THEN
        SELECT p.estado INTO v_estado_prod
          FROM tb_detalle_de_produccion d JOIN tb_produccion p USING (id_produccion)
         WHERE d.id_detalle_de_produccion = OLD.id_detalle_de_produccion;
        IF v_estado_prod = 'Finalizada' THEN
            RAISE EXCEPTION 'No se pueden borrar reportes de una producción Finalizada.';
        END IF;
        RETURN OLD;
    END IF;

    SELECT p.estado, d.cantidad_asignada, d.id_empleado INTO v_estado_prod, v_asignada, v_empleado
      FROM tb_detalle_de_produccion d JOIN tb_produccion p USING (id_produccion)
     WHERE d.id_detalle_de_produccion = NEW.id_detalle_de_produccion;

    IF v_estado_prod = 'Por asignar' THEN
        RAISE EXCEPTION 'La producción aún no ha iniciado: no se aceptan reportes diarios.';
    ELSIF v_estado_prod <> 'En producción' THEN
        RAISE EXCEPTION 'La producción está Finalizada: no se aceptan más reportes diarios.';
    END IF;

    -- Un reporte nuevo solo lo puede hacer un empleado que asistió hoy
    -- (las correcciones de reportes anteriores sí se permiten)
    IF TG_OP = 'INSERT' AND NOT EXISTS (
        SELECT 1 FROM tb_asistencia
         WHERE id_empleado = v_empleado AND fecha = fn_hoy() AND estado = 'Presente') THEN
        RAISE EXCEPTION 'El empleado no está marcado como Presente en la asistencia de hoy: no puede reportar avance.';
    END IF;

    -- El motivo solo tiene sentido si hay defectuosas
    IF NEW.cantidad_defectuosa = 0 THEN
        NEW.motivo_defecto := NULL;
    ELSE
        NEW.motivo_defecto := NULLIF(btrim(NEW.motivo_defecto), '');
    END IF;

    SELECT COALESCE(sum(cantidad + cantidad_defectuosa), 0) INTO v_reportado
      FROM tb_registro_diario
     WHERE id_detalle_de_produccion = NEW.id_detalle_de_produccion
       AND id_registro_diario <> NEW.id_registro_diario;

    IF v_reportado + NEW.cantidad + NEW.cantidad_defectuosa > v_asignada THEN
        RAISE EXCEPTION 'Supera lo asignado: asignado %, ya reportado %, intenta reportar % (% terminadas + % defectuosas).',
            v_asignada, v_reportado, NEW.cantidad + NEW.cantidad_defectuosa, NEW.cantidad, NEW.cantidad_defectuosa;
    END IF;
    RETURN NEW;
END $function$


-- fn_reproceso_cancelado
CREATE OR REPLACE FUNCTION public.fn_reproceso_cancelado()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.estado = 'Cancelado' AND OLD.estado <> 'Cancelado' THEN
        DELETE FROM tb_pasos_produccion WHERE id_reproceso = NEW.id_reproceso;
        DELETE FROM tb_insumos_enviados_x_cliente
         WHERE id_reproceso = NEW.id_reproceso
           AND NOT EXISTS (SELECT 1 FROM tb_detalle_de_produccion d
                            WHERE d.id_insumos_enviados_x_cliente = tb_insumos_enviados_x_cliente.id_insumo_enviado);
    END IF;
    RETURN NULL;
END $function$


-- fn_reproceso_talla_validar
CREATE OR REPLACE FUNCTION public.fn_reproceso_talla_validar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_rep   RECORD;
    v_def   RECORD;
    v_otros INT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF EXISTS (SELECT 1 FROM tb_detalle_de_produccion
                    WHERE id_reproceso = OLD.id_reproceso AND id_detalle_de_remision = OLD.id_detalle_de_remision) THEN
            RAISE EXCEPTION 'No se puede quitar esa talla del reproceso: ya tiene tareas.';
        END IF;
        RETURN OLD;
    END IF;

    SELECT r.id_produccion, r.estado, r.numero, p.id_remision INTO v_rep
      FROM tb_reproceso r JOIN tb_produccion p USING (id_produccion)
     WHERE r.id_reproceso = NEW.id_reproceso;
    IF v_rep.estado <> 'Abierto' THEN
        RAISE EXCEPTION 'El reproceso #% está cancelado.', v_rep.numero;
    END IF;

    SELECT * INTO v_def FROM vw_defectuosas_por_talla
     WHERE id_produccion = v_rep.id_produccion AND id_detalle_de_remision = NEW.id_detalle_de_remision;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'La talla % no pertenece a la remisión %.', NEW.id_detalle_de_remision, v_rep.id_remision;
    END IF;

    -- Lo que ya está en reprocesos (sin contar esta misma fila)
    SELECT COALESCE(sum(rt.cantidad), 0) INTO v_otros
      FROM tb_reproceso_talla rt JOIN tb_reproceso r ON r.id_reproceso = rt.id_reproceso
     WHERE r.id_produccion = v_rep.id_produccion AND r.estado <> 'Cancelado'
       AND rt.id_detalle_de_remision = NEW.id_detalle_de_remision
       AND NOT (rt.id_reproceso = NEW.id_reproceso AND TG_OP = 'UPDATE');

    IF v_otros + NEW.cantidad > v_def.defectuosas THEN
        RAISE EXCEPTION 'De % talla % solo hay % pieza(s) defectuosa(s) por reprocesar; intenta reprocesar %.',
            v_def.nombre_de_la_pieza, v_def.talla, GREATEST(v_def.defectuosas - v_otros, 0), NEW.cantidad;
    END IF;
    RETURN NEW;
END $function$


-- fn_reproceso_validar
CREATE OR REPLACE FUNCTION public.fn_reproceso_validar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_activo RECORD;
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NOT EXISTS (SELECT 1 FROM tb_produccion WHERE id_produccion = NEW.id_produccion AND estado = 'En producción') THEN
            RAISE EXCEPTION 'Solo se puede reprocesar una producción que está En producción.';
        END IF;
        SELECT numero, situacion INTO v_activo FROM vw_reprocesos
         WHERE id_produccion = NEW.id_produccion AND situacion IN ('Por asignar', 'En curso') LIMIT 1;
        IF FOUND THEN
            RAISE EXCEPTION 'Ya hay un reproceso abierto (#%, %): termínelo o cancélelo antes de abrir otro.',
                v_activo.numero, v_activo.situacion;
        END IF;
        NEW.numero := COALESCE((SELECT max(numero) FROM tb_reproceso WHERE id_produccion = NEW.id_produccion), 0) + 1;
        NEW.estado := 'Abierto';
        NEW.observacion := NULLIF(btrim(NEW.observacion), '');
        RETURN NEW;
    END IF;

    IF NEW.id_produccion <> OLD.id_produccion THEN
        RAISE EXCEPTION 'No se puede cambiar la producción de un reproceso.';
    END IF;
    IF NEW.estado IS DISTINCT FROM OLD.estado THEN
        IF NOT (OLD.estado = 'Abierto' AND NEW.estado = 'Cancelado') THEN
            RAISE EXCEPTION 'Cambio de estado no permitido en el reproceso: % -> %', OLD.estado, NEW.estado;
        END IF;
        IF EXISTS (SELECT 1 FROM tb_detalle_de_produccion WHERE id_reproceso = NEW.id_reproceso) THEN
            RAISE EXCEPTION 'No se puede cancelar el reproceso #%: ya tiene tareas asignadas. Elimínelas primero.', NEW.numero;
        END IF;
        NEW.fecha_estado := now();
    END IF;
    RETURN NEW;
END $function$


-- fn_seguimiento_inmutable
CREATE OR REPLACE FUNCTION public.fn_seguimiento_inmutable()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    RAISE EXCEPTION 'El historial de seguimiento no se puede modificar.';
END $function$


-- fn_seguimiento_remision
CREATE OR REPLACE FUNCTION public.fn_seguimiento_remision()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_empleado VARCHAR := fn_empleado_sesion();
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- La crea el cliente desde la página (o un empleado, si se indicó en la sesión)
        INSERT INTO tb_seguimiento_remision
               (id_remision, estado_anterior, estado_nuevo, responsable_empleado, responsable_cliente)
        VALUES (NEW.id_remision, NULL, NEW.estado,
                v_empleado, CASE WHEN v_empleado IS NULL THEN NEW.nit_cliente END);

    ELSIF NEW.estado IS DISTINCT FROM OLD.estado THEN
        IF v_empleado IS NULL THEN
            RAISE EXCEPTION 'Falta el responsable del cambio de estado de la remisión %.', NEW.id_remision
                USING HINT = 'Ejecute antes en la misma transacción: SELECT set_config(''eslabon.id_empleado'', ''EMP00001'', true);';
        END IF;
        INSERT INTO tb_seguimiento_remision
               (id_remision, estado_anterior, estado_nuevo, responsable_empleado)
        VALUES (NEW.id_remision, OLD.estado, NEW.estado, v_empleado);
    END IF;
    RETURN NULL;
END $function$


-- fn_tarea_editar_validar
CREATE OR REPLACE FUNCTION public.fn_tarea_editar_validar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_reportado INT;
BEGIN
    SELECT COALESCE(sum(cantidad + cantidad_defectuosa), 0) INTO v_reportado
      FROM tb_registro_diario WHERE id_detalle_de_produccion = OLD.id_detalle_de_produccion;

    IF TG_OP = 'DELETE' THEN
        IF v_reportado > 0 THEN
            RAISE EXCEPTION 'No se puede eliminar la tarea %: ya tiene % unidades reportadas. Bájele la cantidad en su lugar.',
                OLD.id_detalle_de_produccion, v_reportado;
        END IF;
        RETURN OLD;
    END IF;

    IF NEW.cantidad_asignada < v_reportado THEN
        RAISE EXCEPTION 'La tarea % ya tiene % unidades reportadas: no se le puede asignar menos que eso.',
            OLD.id_detalle_de_produccion, v_reportado;
    END IF;
    IF v_reportado > 0 AND (
        NEW.id_empleado IS DISTINCT FROM OLD.id_empleado OR
        NEW.id_detalle_de_remision IS DISTINCT FROM OLD.id_detalle_de_remision OR
        NEW.id_paso IS DISTINCT FROM OLD.id_paso OR
        NEW.id_tipo_pieza IS DISTINCT FROM OLD.id_tipo_pieza) THEN
        RAISE EXCEPTION 'La tarea % ya tiene reportes: solo se puede cambiar la cantidad, la máquina o el insumo. Para pasar lo que falta a otra persona, bájele la cantidad y cree una tarea nueva.',
            OLD.id_detalle_de_produccion;
    END IF;
    RETURN NEW;
END $function$


-- fn_tras_aprobar_remision
CREATE OR REPLACE FUNCTION public.fn_tras_aprobar_remision()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.estado = 'Aprobada' AND OLD.estado IS DISTINCT FROM 'Aprobada'
       AND NOT EXISTS (SELECT 1 FROM tb_produccion WHERE id_remision = NEW.id_remision) THEN
        INSERT INTO tb_produccion (id_remision, fecha_entrega)
        VALUES (NEW.id_remision,
                CASE WHEN NEW.fecha_entrega >= CURRENT_DATE THEN NEW.fecha_entrega END);
    END IF;
    RETURN NULL;
END $function$


-- fn_validar_estado_remision
CREATE OR REPLACE FUNCTION public.fn_validar_estado_remision()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.estado <> 'Pendiente' THEN
            RAISE EXCEPTION 'Una remisión nueva debe iniciar en estado Pendiente.';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM tb_clientes WHERE nit = NEW.nit_cliente AND estado = 'Activo') THEN
            RAISE EXCEPTION 'El cliente % no existe o está inactivo.', NEW.nit_cliente;
        END IF;
        RETURN NEW;
    END IF;

    IF NEW.estado IS DISTINCT FROM OLD.estado THEN
        IF NOT (
            (OLD.estado = 'Pendiente'     AND NEW.estado IN ('Aprobada', 'Rechazada')) OR
            (OLD.estado = 'Aprobada'      AND NEW.estado IN ('En producción', 'Rechazada')) OR
            (OLD.estado = 'En producción' AND NEW.estado = 'Terminada') OR
            (OLD.estado = 'Terminada'     AND NEW.estado = 'Entregada')
        ) THEN
            RAISE EXCEPTION 'Cambio de estado no permitido: % -> %', OLD.estado, NEW.estado;
        END IF;
        IF NEW.estado = 'Aprobada' AND NEW.total_prendas = 0 THEN
            RAISE EXCEPTION 'No se puede aprobar una remisión sin detalle de prendas.';
        END IF;
    END IF;
    RETURN NEW;
END $function$


-- fn_validar_proveedor_activo
CREATE OR REPLACE FUNCTION public.fn_validar_proveedor_activo()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM proveedores
                   WHERE id_proveedores = NEW.id_proveedor AND estado = 'Activo') THEN
        RAISE EXCEPTION 'El proveedor % no existe o está inactivo.', NEW.id_proveedor;
    END IF;
    RETURN NEW;
END $function$


-- fn_validar_rol_activo
CREATE OR REPLACE FUNCTION public.fn_validar_rol_activo()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM roles WHERE id_rol = NEW.id_rol AND estado = 'Activo') THEN
        RAISE EXCEPTION 'El rol % no existe o está inactivo.', NEW.id_rol;
    END IF;
    RETURN NEW;
END $function$


