const express = require('express');
const passport = require('passport');
const session = require('express-session');
const DiscordStrategy = require('passport-discord').Strategy;
const mongoose = require('mongoose');
// Conectar a la base de datos
mongoose.connect('mongodb+srv://bfw:lecheygalletas@verificationcluster.k7q2z2b.mongodb.net/?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conectado a MongoDB Atlas');
}).catch((err) => {
    console.error('Error al conectarse a MongoDB Atlas', err);
});

// Crear un modelo de usuario
const User = mongoose.model('User', new mongoose.Schema({
    discordId: String,
    accessToken: String
}));
const app = express();

const clientId = '1092496842601803846';
const clientSecret = 'Xk9lOtbqmAwDYFD09lRPkXuFaCHwfBaV';
const scopes = ['identify'];

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

passport.use(new DiscordStrategy({
    clientID: clientId,
    clientSecret: clientSecret,
    callbackURL: 'http://localhost:3000/callback',
    scope: scopes
}, (accessToken, refreshToken, profile, done) => {
    process.nextTick(() => {
        return done(null, profile);
    });
}));

app.get('/', (req, res) => {
    res.send(`
        <html>
        <body>
        ${req.user ? `
        <h1>Hola ${req.user.username}!</h1>
        <p>Aquí está tu token de acceso: ${req.user.accessToken}</p>
        <a href="/logout">Cerrar sesión</a>
        ` : `
        <a href="/login">Iniciar sesión con Discord</a>
        `}
        </body>
        </html>
    `);
});

app.get('/login', passport.authenticate('discord'));

app.get('/callback', passport.authenticate('discord', {
  failureRedirect: '/'
}), async (req, res) => {
  try {
      // Guardar el access token en la base de datos
      const user = new User({
          discordId: req.user.id,
          accessToken: req.user.accessToken
      });
      await user.save();
      console.log(`Token de acceso guardado para el usuario ${req.user.username}`);

      // Redirigir al usuario a la página de éxito
      res.redirect('/success');
  } catch (err) {
      console.error('Error al guardar el token de acceso en la base de datos', err);
      res.redirect('/');
  }
});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

app.listen(3000, () => {
    console.log('Servidor iniciado en http://localhost:3000');
});
