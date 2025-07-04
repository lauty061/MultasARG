const express = require('express');
const app = express();
const path = require('path');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', require('./routes/index'));
app.use('/', require('./routes/personas'));
app.use('/', require('./routes/vehiculos'));
app.use('/', require('./routes/multas'));
app.use('/', require('./routes/accidentes'));

app.listen(3000, () => {
    console.log('Servidor iniciado en http://localhost:3000');
});
