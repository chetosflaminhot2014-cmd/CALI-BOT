require('dotenv').config();

const http = require('http');
const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenAI } = require('@google/genai');

// ==================================================
// SERVIDOR HTTP PARA RENDER
// ==================================================

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });

    res.end('Cali Roleplay Bot Online');
}).listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor HTTP escuchando en el puerto ${PORT}`);
});

// ==================================================
// GEMINI
// ==================================================

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// ==================================================
// CLIENTE DISCORD
// ==================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ==================================================
// CONFIGURACIÓN
// ==================================================

const CANAL_REGISTROS = '1539178148120494140';
const CANAL_LOGS = '1539178435602161764';

// ==================================================
// ROLES AUTORIZADOS
// ==================================================

const ROLES_AUTORIZADOS = {
    '1536111125790462082': 'Administrador General',
    '1539160319962783765': 'Director',
    '1539167225175605268': 'Developer',
    '1539309138977497188': 'CEO'
};

// ==================================================
// ROLES STAFF
// ==================================================

const ROLES_STAFF = {
    '1539160092048625674': 'Helper',
    '1539160028622225499': 'Moderador Junior',
    '1539159775340798013': 'Moderador',
    '1539159687952596992': 'Moderador Senior',
    '1539159549477396601': 'Moderador Global',

    '1536111125790462082': 'Administrador General',
    '1539160319962783765': 'Director',
    '1539167225175605268': 'Developer',
    '1539309138977497188': 'CEO'
};

// ==================================================
// ORDEN DEL STAFF
// ==================================================

const ORDEN_STAFF = [
    ['CEO', '1539309138977497188'],
    ['Developer', '1539167225175605268'],
    ['Director', '1539160319962783765'],
    ['Administrador General', '1536111125790462082'],
    ['Moderador Global', '1539159549477396601'],
    ['Moderador Senior', '1539159687952596992'],
    ['Moderador', '1539159775340798013'],
    ['Moderador Junior', '1539160028622225499'],
    ['Helper', '1539160092048625674']
];

// ==================================================
// BOT ENCENDIDO
// ==================================================

client.once('clientReady', function () {

    console.log('====================================');
    console.log('BOT CALI ROLEPLAY ENCENDIDO');
    console.log('Usuario: ' + client.user.tag);
    console.log('====================================');

});

// ==================================================
// OBTENER RANGO AUTORIZADOR
// ==================================================

function obtenerRangoAutorizador(member) {

    if (!member) {
        return null;
    }

    for (const roleId of Object.keys(ROLES_AUTORIZADOS)) {

        if (member.roles.cache.has(roleId)) {
            return ROLES_AUTORIZADOS[roleId];
        }

    }

    return null;
}

// ==================================================
// COMPROBAR AUTORIZACIÓN
// ==================================================

function estaAutorizado(member) {

    if (!member) {
        return false;
    }

    return Object.keys(ROLES_AUTORIZADOS).some(function (roleId) {

        return member.roles.cache.has(roleId);

    });

}

// ==================================================
// OBTENER FECHA
// ==================================================

function obtenerFecha() {

    const ahora = new Date();

    const dia =
        String(ahora.getDate()).padStart(2, '0');

    const mes =
        String(ahora.getMonth() + 1).padStart(2, '0');

    const año =
        ahora.getFullYear();

    return dia + '/' + mes + '/' + año;
}

// ==================================================
// QUITAR ROLES STAFF
// ==================================================

async function quitarRolesStaff(member) {

    for (const roleId of Object.keys(ROLES_STAFF)) {

        if (member.roles.cache.has(roleId)) {

            await member.roles.remove(roleId);

        }

    }

}

// ==================================================
// ENVIAR LOG
// ==================================================

async function enviarLog(texto) {

    try {

        const canal =
            await client.channels.fetch(CANAL_LOGS);

        if (!canal) {

            console.log(
                'Canal de logs no encontrado.'
            );

            return;

        }

        await canal.send({
            content: texto,
            allowedMentions: {
                parse: ['users']
            }
        });

    } catch (error) {

        console.error(
            'Error enviando log:',
            error
        );

    }

}

// ==================================================
// GENERAR LISTA DE STAFF
// ==================================================

async function generarListaStaff(guild) {

    try {

        await guild.members.fetch();

    } catch (error) {

        console.error(
            'No se pudieron obtener todos los miembros:',
            error
        );

    }

    let respuesta =
`# Cali Roleplay — Staff

`;

    for (const [nombre, roleId] of ORDEN_STAFF) {

        const role =
            guild.roles.cache.get(roleId);

        if (!role) {

            respuesta +=
                `- **${nombre}** - N/A\n\n`;

            continue;

        }

        const miembros =
            role.members;

        if (!miembros || miembros.size === 0) {

            respuesta +=
                `- <@&${roleId}> - N/A\n\n`;

            continue;

        }

        const personal =
            [...miembros.values()]
                .map(function (member) {

                    return `<@${member.id}>`;

                })
                .join(' - ');

        respuesta +=
            `- <@&${roleId}> - ${personal}\n\n`;

    }

    return respuesta;
}

// ==================================================
// MENSAJES
// ==================================================

client.on('messageCreate', async function (message) {

    if (message.author.bot) {
        return;
    }

    console.log(
        'Mensaje recibido: ' +
        message.content
    );

    // ==================================================
    // IA DE CALI ROLEPLAY - GEMINI
    // ==================================================

    if (message.mentions.has(client.user)) {

        const pregunta =
            message.content
                .replace(
                    new RegExp(
                        '<@!?' +
                        client.user.id +
                        '>',
                        'g'
                    ),
                    ''
                )
                .trim();

        if (!pregunta) {

            return message.reply(
                'Hola. Soy Cali Roleplay. ¿Qué quieres preguntarme?'
            );

        }

        try {

            await message.channel.sendTyping();

            const respuesta =
                await ai.models.generateContent({

                    model: 'gemini-3.6-flash',

                    contents:
                        'Eres Cali Roleplay, el asistente oficial de un servidor de Discord de roleplay. ' +
                        'Responde siempre en español. ' +
                        'Sé amable, claro y breve. ' +
                        'Puedes responder preguntas generales y ayudar con Discord, programación y roleplay. ' +
                        'No inventes información específica del servidor.\n\n' +
                        'Pregunta del usuario:\n' +
                        pregunta

                });

            const textoRespuesta =
                respuesta.text;

            if (!textoRespuesta) {

                return message.reply(
                    'No pude generar una respuesta.'
                );

            }

            return message.reply(
                textoRespuesta
            );

        } catch (error) {

            console.error(
                'Error con Gemini:',
                error
            );

            return message.reply(
                'No pude procesar tu pregunta en este momento.'
            );

        }

    }

    // ==================================================
    // COMANDOS
    // ==================================================

    const contenido =
        message.content.trim();

    if (!contenido) {
        return;
    }

    const args =
        contenido.split(/\s+/);

    const comando =
        args[0].toLowerCase();

    // ==================================================
    // !STAFF
    // ==================================================

    if (comando === '!staff') {

        try {

            const lista =
                await generarListaStaff(
                    message.guild
                );

            return message.channel.send({
                content: lista,
                allowedMentions: {
                    parse: ['users', 'roles']
                }
            });

        } catch (error) {

            console.error(
                'Error generando !staff:',
                error
            );

            return message.reply(
                'No pude obtener la lista del Staff.'
            );

        }

    }

    // ==================================================
    // COMANDOS STAFF
    // ==================================================

    const comandosStaff = [
        '!ingreso',
        '!ascenso',
        '!degrado',
        '!salida'
    ];

    if (comandosStaff.includes(comando)) {

        if (!estaAutorizado(message.member)) {

            return message.reply(
                'No tienes un cargo autorizado para utilizar este comando.'
            );

        }

        const rangoAutorizador =
            obtenerRangoAutorizador(
                message.member
            );

        const usuario =
            message.mentions.members.first();

        if (!usuario) {

            return message.reply(
                'Debes mencionar al usuario.\n\n' +
                'Ejemplo:\n' +
                '!ascenso @Usuario @Moderador'
            );

        }

        // ==================================================
        // INGRESO / ASCENSO / DEGRADO
        // ==================================================

        if (
            comando === '!ingreso' ||
            comando === '!ascenso' ||
            comando === '!degrado'
        ) {

            const rolesMencionados =
                message.mentions.roles;

            if (rolesMencionados.size === 0) {

                return message.reply(
                    'Debes mencionar el rango Staff.\n\n' +
                    'Ejemplo:\n' +
                    '!ascenso @Usuario @Moderador'
                );

            }

            let rolNuevo = null;

            for (
                const rol
                of rolesMencionados.values()
            ) {

                if (ROLES_STAFF[rol.id]) {

                    rolNuevo = rol;

                    break;

                }

            }

            if (!rolNuevo) {

                return message.reply(
                    'El rol mencionado no es un rango Staff válido.\n\n' +
                    'Rangos válidos:\n' +
                    '• @Helper\n' +
                    '• @Moderador Junior\n' +
                    '• @Moderador\n' +
                    '• @Moderador Senior\n' +
                    '• @Moderador Global\n' +
                    '• @Administrador General\n' +
                    '• @Director\n' +
                    '• @Developer\n' +
                    '• @CEO'
                );

            }

            const nombreRango =
                ROLES_STAFF[rolNuevo.id];

            try {

                // Quitar rangos Staff anteriores

                await quitarRolesStaff(
                    usuario
                );

                // Dar nuevo rango

                await usuario.roles.add(
                    rolNuevo.id
                );

                let accion = '';

                if (comando === '!ingreso') {
                    accion = 'Ingreso';
                }

                if (comando === '!ascenso') {
                    accion = 'Ascenso';
                }

                if (comando === '!degrado') {
                    accion = 'Degradación';
                }

                const fecha =
                    obtenerFecha();

                // ==========================================
                // REGISTRO
                // ==========================================

                const registro =
                    accion +
                    ' | ' +
                    usuario.user.username +
                    ' | ' +
                    `<@${usuario.id}>` +
                    ' | ' +
                    nombreRango +
                    ' | ' +
                    fecha +
                    '\n\n' +
                    'Firma: ' +
                    rangoAutorizador +
                    ' | ' +
                    `<@${message.author.id}>`;

                const canal =
                    await client.channels.fetch(
                        CANAL_REGISTROS
                    );

                await canal.send({
                    content: registro,
                    allowedMentions: {
                        parse: ['users']
                    }
                });

                // ==========================================
                // LOG
                // ==========================================

                await enviarLog(
                    '[LOG]\n\n' +
                    'Usuario: ' +
                    `<@${message.author.id}>` +
                    '\n' +
                    'Rango: ' +
                    rangoAutorizador +
                    '\n' +
                    'Acción: ' +
                    accion +
                    '\n' +
                    'Objetivo: ' +
                    `<@${usuario.id}>` +
                    '\n' +
                    'Nuevo rango: ' +
                    nombreRango +
                    '\n' +
                    'Fecha: ' +
                    fecha
                );

                // ==========================================
                // RESPUESTA
                // ==========================================

                return message.reply({
                    content:
                        accion +
                        ' realizado correctamente.\n' +
                        'Usuario: <@' +
                        usuario.id +
                        '>\n' +
                        'Autorizado por: <@' +
                        message.author.id +
                        '>\n' +
                        'Rango: ' +
                        rolNuevo,
                    allowedMentions: {
                        parse: ['users', 'roles']
                    }
                });

            } catch (error) {

                console.error(
                    'Error modificando roles:',
                    error
                );

                return message.reply(
                    'No pude modificar los roles. ' +
                    'Comprueba que el bot tenga Gestionar Roles y que su rol esté por encima de los rangos Staff.'
                );

            }

        }

        // ==================================================
        // SALIDA
        // ==================================================

        if (comando === '!salida') {

            try {

                await quitarRolesStaff(
                    usuario
                );

                const fecha =
                    obtenerFecha();

                // ==========================================
                // REGISTRO DE SALIDA
                // ==========================================

                const registro =
                    'Expulsión | ' +
                    usuario.user.username +
                    ' | ' +
                    `<@${usuario.id}>` +
                    ' | — | ' +
                    fecha +
                    '\n\n' +
                    'Firma: ' +
                    rangoAutorizador +
                    ' | ' +
                    `<@${message.author.id}>`;

                const canal =
                    await client.channels.fetch(
                        CANAL_REGISTROS
                    );

                await canal.send({
                    content: registro,
                    allowedMentions: {
                        parse: ['users']
                    }
                });

                // ==========================================
                // LOG DE SALIDA
                // ==========================================

                await enviarLog(
                    '[LOG]\n\n' +
                    'Usuario: ' +
                    `<@${message.author.id}>` +
                    '\n' +
                    'Rango: ' +
                    rangoAutorizador +
                    '\n' +
                    'Acción: Expulsión\n' +
                    'Objetivo: ' +
                    `<@${usuario.id}>` +
                    '\n' +
                    'Roles Staff eliminados: Sí\n' +
                    'Fecha: ' +
                    fecha
                );

                // ==========================================
                // RESPUESTA
                // ==========================================

                return message.reply({
                    content:
                        'Salida registrada correctamente.\n' +
                        'Usuario: <@' +
                        usuario.id +
                        '>\n' +
                        'Autorizado por: <@' +
                        message.author.id +
                        '>\n' +
                        'Roles Staff eliminados.',
                    allowedMentions: {
                        parse: ['users']
                    }
                });

            } catch (error) {

                console.error(
                    'Error quitando roles:',
                    error
                );

                return message.reply(
                    'No pude quitar los roles. ' +
                    'Comprueba que el bot tenga Gestionar Roles y que su rol esté por encima de los rangos Staff.'
                );

            }

        }

    }

    // ==================================================
    // !LOG
    // ==================================================

    if (comando === '!log') {

        if (!estaAutorizado(message.member)) {

            return message.reply(
                'No tienes un cargo autorizado para utilizar este comando.'
            );

        }

        const texto =
            args.slice(1).join(' ');

        if (!texto) {

            return message.reply(
                'Debes escribir el texto que quieres registrar.\n\n' +
                'Ejemplo:\n' +
                '!log Se realizó una revisión administrativa.'
            );

        }

        const rangoAutorizador =
            obtenerRangoAutorizador(
                message.member
            );

        const fecha =
            obtenerFecha();

        const log =
            '[LOG]\n\n' +
            'Usuario: ' +
            `<@${message.author.id}>` +
            '\n' +
            'Rango: ' +
            rangoAutorizador +
            '\n' +
            'Texto: ' +
            texto +
            '\n' +
            'Fecha: ' +
            fecha;

        await enviarLog(
            log
        );

        return message.reply(
            'Texto registrado correctamente en los logs.'
        );

    }

});

// ==================================================
// LOGIN
// ==================================================

if (!process.env.TOKEN) {

    console.error(
        'No se encontró TOKEN en el archivo .env'
    );

    process.exit(1);

}

client.login(
    process.env.TOKEN
);
