import bcrypt from 'bcrypt';
import passport from "passport";
import { Strategy } from "passport-local";
import { getUtilisateurParID,getUtilisateurParcourriel } from "./model/utilisateur.js";

// Configuration générale de la stratégie.
// On indique ici qu'on s'attends à ce que le client
// envoit un variable "courriel" et "motDePasse" au
// serveur pour l'authentification.
const config = {
    usernameField: 'courriel',
    passwordField: 'motDePasse'
};

// Configuration de quoi faire avec l'identifiant
// et le mot de passe pour les valider
passport.use(new Strategy(config, async (courriel, motDePasse, done) => {
    // S'il y a une erreur avec la base de données,
    // on retourne l'erreur au serveur
    try {
        // On va chercher l'utilisateur dans la base
        // de données avec son identifiant, le
        // courriel ici
        const utilisateur = await getUtilisateurParcourriel(courriel);

        // Si on ne trouve pas l'utilisateur, on
        // retourne que l'authentification a échoué
        // avec un message
        if (!utilisateur) {
            return done(null, false, { error: 'mauvais_utilisateur' });
        }

        // Si on a trouvé l'utilisateur, on compare
        // son mot de passe dans la base de données
        // avec celui envoyé au serveur. On utilise
        // une fonction de bcrypt pour le faire
        const valide = await bcrypt.compare(motDePasse, utilisateur.mot_de_passe);

        // Si les mot de passe ne concorde pas, on
        // retourne que l'authentification a échoué
        // avec un message
        if (!valide) {
            return done(null, false, { error: 'mauvais_mot_de_passe' });
        }
        // Vérification si l'utilisateur est un administrateur
        const isAdmin = (utilisateur.id_type_utilisateur === 2); 
        
        // Ajouter la propriété isAdmin à l'objet utilisateur
        const utilisateurAvecAdmin = { ...utilisateur, isAdmin };

        return done(null, utilisateurAvecAdmin)
        // Si les mot de passe concorde, on retourne
        // l'information de l'utilisateur au serveur
    }
    catch (error) {
        return done(error);
    }
}));
passport.serializeUser((utilisateur, done) => {
    // On mets uniquement le courriel dans la session
    done(null, utilisateur.courriel);
});
passport.deserializeUser(async (courriel, done) => {
    // S'il y a une erreur de base de donnée, on
    // retourne l'erreur au serveur
    try {
        // Puisqu'on a juste l'adresse courriel dans
        // la session, on doit être capable d'aller
        // chercher l'utilisateur avec celle-ci dans
        // la base de données.
        const utilisateur = await getUtilisateurParcourriel(courriel);
        done(null, utilisateur);
    }
    catch (error) {
        done(error);
    }
})