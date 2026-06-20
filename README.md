# Margeen Admin

Panel administrativo en **React + TypeScript + Tailwind CSS** para gestionar el backend de Margeen.

## Requisitos

- Node.js 20+
- API Laravel (`margeen-api`) corriendo en `http://127.0.0.1:8000`

## Instalación

```bash
cd margeen-admin
npm install
cp .env.example .env
```

## Desarrollo

1. Inicia la API:

```bash
cd ../margeen-api
php artisan serve
```

2. Inicia el panel:

```bash
cd ../margeen-admin
npm run dev
```

Abre `http://localhost:5173`

**Credenciales demo:** `admin@demo.com` / `password`

En desarrollo, Vite hace proxy de `/api` hacia `http://127.0.0.1:8000`.

## Producción

```bash
npm run build
```

Configura `VITE_API_URL` apuntando a tu API desplegada:

```env
VITE_API_URL=https://tu-api.railway.app/api
```

En la API Laravel, agrega el dominio del panel en `CORS_ALLOWED_ORIGINS`:

```env
CORS_ALLOWED_ORIGINS=https://admin.tudominio.com,http://localhost:5173
```

## Módulos incluidos

| Módulo | Funciones | Acceso |
|--------|-----------|--------|
| **Empresas** | CRUD, logo, notas internas, admin inicial | Solo super admin |
| Dashboard | Ventas, ganancia, margen, tops | Admin / vendedor |
| Facturas | Listar, crear, detalle, PDF, cancelar | Admin / vendedor |
| Clientes | CRUD con búsqueda | Admin / vendedor |
| Productos | CRUD con búsqueda | Admin |
| Usuarios | CRUD vendedores/admin | Admin |

## Super Admin

```
Email: superadmin@margeen.com
Password: password
```

En la API (después de `php artisan migrate`):

```bash
php artisan db:seed --class=SuperAdminSeeder
```

Variables opcionales: `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `SUPER_ADMIN_NAME`

## Stack

- React 19 + Vite
- Tailwind CSS v4
- React Router
- Axios (JWT + refresh token)
- Lucide icons
# margeen-admin
