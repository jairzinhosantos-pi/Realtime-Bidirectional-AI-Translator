# Instrucciones de Configuracion - AI Translator

## Cambios Implementados

El sistema ha sido actualizado para permitir que dos usuarios en dispositivos separados puedan comunicarse mediante traduccion de voz en tiempo real.

### Arquitectura Nueva

- **Backend**: API REST con WebSockets para comunicacion en tiempo real
- **Frontend**: Interfaz de chat con sistema de sesiones
- **Flujo**: Un usuario crea una sesion, el otro se une, y pueden intercambiar mensajes traducidos

## Instalacion

### Backend

1. Navegar al directorio del backend:
```bash
cd backend
```

2. Instalar las nuevas dependencias:
```bash
pip install -r requirements.txt
```

3. Asegurarse de que el archivo `.env` tiene la API key de OpenAI:
```
OPENAI_API_KEY=tu_api_key_aqui
```

4. Iniciar el servidor:
```bash
python app.py
```

El servidor iniciara en `http://0.0.0.0:3000`

### Frontend

1. Navegar al directorio del frontend:
```bash
cd frontend
```

2. Instalar las nuevas dependencias:
```bash
npm install
```

3. Iniciar el servidor de desarrollo:
```bash
npm start
```

El frontend estara disponible en `http://192.168.100.53:4200`

## Como Usar

### Paso 1: Crear Sesion (Usuario 1)

1. Abrir el navegador en `http://192.168.100.53:4200`
2. Seleccionar "Crear Nueva Sesion"
3. Ingresar tu nombre y seleccionar tu idioma
4. Click en "Crear Sesion"
5. Se mostrara un codigo de sesion (ej: "ABC123")
6. Compartir este codigo con el otro usuario

### Paso 2: Unirse a Sesion (Usuario 2)

1. En otro dispositivo, abrir `http://192.168.100.53:4200`
2. Seleccionar "Unirse a Sesion Existente"
3. Ingresar el codigo de sesion compartido
4. Ingresar tu nombre y seleccionar tu idioma
5. Click en "Unirse"

### Paso 3: Comunicarse

1. Mantener presionado el boton de grabacion
2. Hablar en tu idioma
3. Soltar el boton para enviar
4. El mensaje sera traducido y enviado al otro usuario
5. El otro usuario recibira el mensaje traducido y podra reproducirlo

## Caracteristicas

- Traduccion bidireccional en tiempo real
- Soporte para 8 idiomas (Español, Ingles, Frances, Aleman, Italiano, Portugues, Chino, Japones)
- Interfaz de chat intuitiva
- Historial de mensajes en la sesion
- Audio de alta calidad generado por OpenAI TTS
- Transcripciones visibles de cada mensaje

## Notas Tecnicas

### WebSockets

El sistema usa WebSockets para notificar en tiempo real cuando llega un nuevo mensaje. Esto permite que la experiencia sea fluida sin necesidad de refrescar la pagina.

### Sesiones en Memoria

Las sesiones se almacenan en memoria en el servidor. Si el servidor se reinicia, las sesiones se perderan. Para produccion, se recomienda usar Redis o una base de datos.

### Red Local

Por ahora, el sistema esta configurado para funcionar en red local (`192.168.100.53`). Para permitir acceso desde internet, sera necesario:

1. Desplegar el backend en un servidor con IP publica o dominio
2. Configurar HTTPS (requerido para acceso al microfono)
3. Actualizar las URLs en los servicios del frontend

## Arquitectura de Archivos

### Backend (Nuevos)
- `session_manager.py`: Manejo de sesiones y usuarios
- Eventos WebSocket en `app.py`
- Nuevos endpoints REST para sesiones

### Frontend (Nuevos)
- `session-setup.component.ts`: Pantalla inicial de configuracion
- `chat.component.ts`: Interfaz de chat
- `websocket.service.ts`: Manejo de WebSockets
- `session.service.ts`: Manejo de sesiones
- `app.routes.ts`: Configuracion de rutas

### Frontend (Modificados)
- `translation.service.ts`: Agregado metodo `sendMessage`
- `models.ts`: Nuevos modelos de datos
- `main.ts`: Configuracion de routing
- `app.component.ts`: Simplificado a router-outlet

## Troubleshooting

### El backend no inicia
- Verificar que todas las dependencias estan instaladas
- Verificar que el archivo .env tiene la API key correcta

### El frontend muestra errores
- Ejecutar `npm install` nuevamente
- Verificar que la version de Node.js es compatible (v16+)

### No se conecta el WebSocket
- Verificar que el backend este corriendo
- Verificar que no hay firewall bloqueando el puerto 3000
- Revisar la consola del navegador para errores

### El otro usuario no recibe mensajes
- Verificar que ambos usuarios esten en la misma sesion
- Verificar que ambos tengan conexion activa al servidor
- Revisar los logs del servidor backend

## Proximos Pasos

Para escalar a usuarios en diferentes paises:

1. Desplegar backend en servicio cloud (Render, Railway, Heroku)
2. Configurar dominio y certificado SSL
3. Actualizar URLs en el frontend
4. Desplegar frontend en Vercel o Netlify
5. Considerar agregar base de datos para persistencia
