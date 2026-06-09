# Quick Setup JSONs — Crear Usuarios de Prueba

**Fecha**: 2026-06-09
**Importante**: NO incluir campo `active` en ningún CreateDTO

---

## 1. Crear Sellers (POST /api/sellers)

### Seller 1
```json
{
  "name": "Juan Pérez",
  "profile": "Vendedor senior"
}
```

**Response esperado**:
```json
{
  "id": "uuid-seller1",
  "name": "Juan Pérez",
  "profile": "Vendedor senior",
  "userId": null,
  "active": true,
  "createdAt": "2026-06-09T..."
}
```

**👉 Copiar `id` del response** (lo necesitarás para vincular el usuario)

---

### Seller 2
```json
{
  "name": "María López",
  "profile": "Vendedora junior"
}
```

**👉 Copiar `id` del response**

---

## 2. Crear Users (POST /api/users)

**⚠️ Importante**: Necesitas estar autenticado como **Admin** con el token en "Authorize"

### User Director
```json
{
  "username": "director1",
  "name": "Carlos Director",
  "password": "Director123!",
  "role": "Director"
}
```

---

### User Seller1 (vinculado a Juan Pérez)
```json
{
  "username": "seller1",
  "name": "Juan Pérez",
  "password": "Seller123!",
  "role": "Seller",
  "sellerId": "<pegar-id-de-seller1-aqui>"
}
```

**👉 Reemplazar `<pegar-id-de-seller1-aqui>` con el UUID que copiaste en el paso 1**

---

### User Seller2 (vinculado a María López)
```json
{
  "username": "seller2",
  "name": "María López",
  "password": "Seller123!",
  "role": "Seller",
  "sellerId": "<pegar-id-de-seller2-aqui>"
}
```

---

## Credenciales Creadas

Una vez completado el setup, tendrás:

| Username | Password | Role | Seller vinculado |
|----------|----------|------|------------------|
| admin | admin123 | Admin | — |
| director1 | Director123! | Director | — |
| seller1 | Seller123! | Seller | Juan Pérez |
| seller2 | Seller123! | Seller | María López |

---

## Campos que NO se deben incluir

❌ **NO incluir** en CreateSellerDto:
- `active` (se crea activo por defecto)
- `id` (se genera automáticamente)
- `userId` (opcional, se puede asignar después)
- `createdAt` (se genera automáticamente)

❌ **NO incluir** en CreateUserDto:
- `active` (se crea activo por defecto)
- `id` (se genera automáticamente)
- `createdAt` (se genera automáticamente)

✅ **SÍ incluir** en CreateUserDto:
- `username` (requerido, min 3 caracteres)
- `password` (requerido, min 6 caracteres)
- `name` (requerido)
- `role` (requerido: "Admin" | "Director" | "Seller")
- `sellerId` (opcional, solo para role="Seller")

---

## Troubleshooting

### Error: "property active should not exist"
**Solución**: Quita el campo `active` del JSON

### Error: "property name should not be empty"
**Solución**: Agrega el campo `name` (es requerido en CreateUserDto)

### Error: "password must be longer than or equal to 6 characters"
**Solución**: Usa password de mínimo 6 caracteres

### Error: "Unauthorized" al crear users
**Solución**:
1. Haz login como admin: POST /api/auth/login
2. Copia el accessToken del response
3. Click en "Authorize" en Swagger
4. Pega: `Bearer <accessToken>`

---

## Siguiente Paso

Una vez creados los usuarios, puedes:

1. **Login como seller1** en frontend: http://localhost:3001
2. **Crear datos de prueba** (clientes, tareas, actividades, deals, ventas)
3. **Ejecutar testing manual** siguiendo `MANUAL_TESTING_GUIDE.md`
