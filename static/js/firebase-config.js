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

// Utilitário de resiliência: impede que requisições ao Firestore fiquem presas em fila indefinida
function withFirestoreTimeout(promise, ms = 2500) {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("Timeout de comunicação com o Firestore")), ms);
    });
    return Promise.race([
        promise.finally(() => clearTimeout(timer)),
        timeoutPromise
    ]);
}

const AuthService = {
    async cadastrar(nome, email, senha) {
        if (!nome || !email || !senha) {
            throw new Error("Preencha todos os campos obrigatórios.");
        }
        if (senha.length < 6) {
            throw new Error("A senha deve ter no mínimo 6 caracteres.");
        }

        // 1. Cria usuário no Firebase Auth
        const credencial = await auth.createUserWithEmailAndPassword(email, senha);
        const user = credencial.user;

        // 2. Atualiza nome no perfil Auth
        try {
            await user.updateProfile({ displayName: nome });
        } catch (e) {
            console.warn("Aviso ao atualizar displayName no Firebase Auth:", e);
        }

        // 3. Salva documento complementar no Firestore (não-bloqueante se o banco não estiver provisionado)
        try {
            await withFirestoreTimeout(
                db.collection("usuarios").doc(user.uid).set({
                    uid: user.uid,
                    nome: nome,
                    email: email,
                    fotoPerfil: null,
                    criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
                    ultimoAcesso: firebase.firestore.FieldValue.serverTimestamp()
                }),
                2500
            );
        } catch (e) {
            console.warn("Aviso: Dados extras não puderam ser gravados no Firestore (banco pode não estar criado no Firebase Console):", e);
        }

        return user;
    },

    async login(email, senha) {
        if (!email || !senha) {
            throw new Error("Informe seu e-mail e sua senha.");
        }

        // 1. Realiza login via Firebase Auth
        const credencial = await auth.signInWithEmailAndPassword(email, senha);

        // 2. Atualiza data de último acesso no Firestore de forma não-bloqueante
        try {
            await withFirestoreTimeout(
                db.collection("usuarios").doc(credencial.user.uid).update({
                    ultimoAcesso: firebase.firestore.FieldValue.serverTimestamp()
                }),
                1500
            );
        } catch (e) {
            console.warn("Aviso: Não foi possível atualizar data de último acesso no Firestore:", e);
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
        if (!uid) return null;
        try {
            const doc = await withFirestoreTimeout(
                db.collection("usuarios").doc(uid).get(),
                3000
            );
            if (doc && doc.exists) {
                return doc.data();
            }
        } catch (e) {
            console.warn("Aviso ao buscar perfil no Firestore:", e);
        }
        return null;
    },

    async atualizarPerfil(uid, dados) {
        if (!uid) return;
        try {
            await withFirestoreTimeout(
                db.collection("usuarios").doc(uid).update({
                    ...dados,
                    atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
                }),
                3000
            );
        } catch (e) {
            console.warn("Aviso ao atualizar perfil no Firestore:", e);
        }
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

        try {
            const docRef = await withFirestoreTimeout(
                db.collection("usuarios").doc(uid).collection("diario").add(registro),
                3000
            );
            return { id: docRef.id, ...registro };
        } catch (e) {
            console.warn("Aviso ao salvar registro no diário Firestore:", e);
            return { id: "local_" + Date.now(), ...registro };
        }
    },

    async listarRegistrosDiario(uid, limite = 10) {
        if (!uid) return [];
        try {
            const snapshot = await withFirestoreTimeout(
                db.collection("usuarios")
                    .doc(uid)
                    .collection("diario")
                    .orderBy("criadoEm", "desc")
                    .limit(limite)
                    .get(),
                3000
            );

            const lista = [];
            snapshot.forEach(doc => {
                lista.push({ id: doc.id, ...doc.data() });
            });
            return lista;
        } catch (e) {
            console.warn("Aviso ao listar diário do Firestore:", e);
            return [];
        }
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

        try {
            const docRef = await withFirestoreTimeout(
                db.collection("usuarios").doc(uid).collection("historico_ferramentas").add(sessao),
                3000
            );
            return { id: docRef.id, ...sessao };
        } catch (e) {
            console.warn("Aviso ao registrar sessão no Firestore:", e);
            return null;
        }
    },

    async obterHistoricoFerramentas(uid, ferramenta = null, limite = 20) {
        if (!uid) return [];
        try {
            let query = db.collection("usuarios").doc(uid).collection("historico_ferramentas");

            if (ferramenta) {
                query = query.where("ferramenta", "==", ferramenta);
            }

            const snapshot = await withFirestoreTimeout(
                query.orderBy("criadoEm", "desc").limit(limite).get(),
                3000
            );
            const itens = [];
            snapshot.forEach(doc => {
                itens.push({ id: doc.id, ...doc.data() });
            });
            return itens;
        } catch (e) {
            console.warn("Aviso ao obter histórico do Firestore:", e);
            return [];
        }
    }
};

window.firebaseConfig = firebaseConfig;
window.auth = auth;
window.db = db;
window.AuthService = AuthService;
window.DataCollectionsService = DataCollectionsService;
