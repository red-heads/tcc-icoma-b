const firebaseConfig = {
    apiKey: "AIzaSyAmOBqax6nN0nLU6QcEAvpOH4TpSnf_qMw",
    authDomain: "tudo-bem-ai-dados.firebaseapp.com",
    projectId: "tudo-bem-ai-dados",
    storageBucket: "tudo-bem-ai-dados.firebasestorage.app",
    messagingSenderId: "168812614463",
    appId: "1:168812614463:web:926292798a366b1843798a",
    measurementId: "G-05Z2RBPH46"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function (error) {
    console.warn("Aviso ao definir persistência do Firebase Auth:", error);
});

const AuthService = {
    async cadastrar(nome, email, senha) {
        if (!nome || !email || !senha) {
            throw new Error("Preencha todos os campos obrigatórios.");
        }
        if (senha.length < 6) {
            throw new Error("A senha deve ter no mínimo 6 caracteres.");
        }

        const credencial = await auth.createUserWithEmailAndPassword(email, senha);
        const user = credencial.user;

        await user.updateProfile({ displayName: nome });

        await db.collection("usuarios").doc(user.uid).set({
            uid: user.uid,
            nome: nome,
            email: email,
            fotoPerfil: null,
            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            ultimoAcesso: firebase.firestore.FieldValue.serverTimestamp()
        });

        return user;
    },

    async login(email, senha) {
        if (!email || !senha) {
            throw new Error("Informe seu e-mail e sua senha.");
        }
        const credencial = await auth.signInWithEmailAndPassword(email, senha);

        try {
            await db.collection("usuarios").doc(credencial.user.uid).update({
                ultimoAcesso: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (e) {
            console.warn("Não foi possível atualizar data de último acesso:", e);
        }

        return credencial.user;
    },

    async logout() {
        await auth.signOut();
    },

    async recuperarSenha(email) {
        if (!email) {
            throw new Error("Informe o e-mail cadastrado.");
        }
        await auth.sendPasswordResetEmail(email);
    },

    getUsuarioAtual() {
        return auth.currentUser;
    },
    onAuthStateChanged(callback) {
        return auth.onAuthStateChanged(callback);
    }
};

const DataCollectionsService = {
    async obterPerfil(uid) {
        const doc = await db.collection("usuarios").doc(uid).get();
        if (doc.exists) {
            return doc.data();
        }
        return null;
    },

    async atualizarPerfil(uid, dados) {
        await db.collection("usuarios").doc(uid).update({
            ...dados,
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
        });
    },

    async salvarRegistroDiario(uid, { humor, nota, sentimento, texto }) {
        if (!uid) throw new Error("Usuário não identificado para salvar no diário.");

        const registro = {
            uid: uid,
            humor: humor || "neutro",
            nota: nota || 3,
            sentimento: sentimento || "",
            texto: texto || "",
            criadoEm: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection("usuarios").doc(uid).collection("diario").add(registro);
        return { id: docRef.id, ...registro };
    },

    async listarRegistrosDiario(uid, limite = 10) {
        if (!uid) return [];
        const snapshot = await db.collection("usuarios")
            .doc(uid)
            .collection("diario")
            .orderBy("criadoEm", "desc")
            .limit(limite)
            .get();

        const lista = [];
        snapshot.forEach(doc => {
            lista.push({ id: doc.id, ...doc.data() });
        });
        return lista;
    },

    async registrarSessaoFerramenta(uid, { ferramenta, duracaoSegundos, detalhes = {} }) {
        if (!uid) return null;

        const sessao = {
            uid: uid,
            ferramenta: ferramenta,
            duracaoSegundos: duracaoSegundos || 0,
            detalhes: detalhes,
            criadoEm: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection("usuarios").doc(uid).collection("historico_ferramentas").add(sessao);
        return { id: docRef.id, ...sessao };
    },

    async obterHistoricoFerramentas(uid, ferramenta = null, limite = 20) {
        if (!uid) return [];
        let query = db.collection("usuarios").doc(uid).collection("historico_ferramentas");

        if (ferramenta) {
            query = query.where("ferramenta", "==", ferramenta);
        }

        const snapshot = await query.orderBy("criadoEm", "desc").limit(limite).get();
        const itens = [];
        snapshot.forEach(doc => {
            itens.push({ id: doc.id, ...doc.data() });
        });
        return itens;
    }
};

window.firebaseConfig = firebaseConfig;
window.auth = auth;
window.db = db;
window.AuthService = AuthService;
window.DataCollectionsService = DataCollectionsService;
