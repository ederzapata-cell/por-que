(() => {
  const auth = window.pqFirebaseAuth;
  const db = window.pqFirestore;
  if (!auth) {
    console.error("Firebase Auth no se inicializó.");
    return;
  }

  const accountButton = document.getElementById("accountButton");
  const accountInitial = document.getElementById("accountInitial");
  const authModal = document.getElementById("authModal");
  const closeAuth = document.getElementById("closeAuth");
  const googleSignIn = document.getElementById("googleSignIn");
  const authStatus = document.getElementById("authStatus");
  const signedOutView = document.getElementById("signedOutView");
  const signedInView = document.getElementById("signedInView");
  const userAvatar = document.getElementById("userAvatar");
  const userName = document.getElementById("userName");
  const userEmail = document.getElementById("userEmail");
  const signOutButton = document.getElementById("signOutButton");

  function openAuth() {
    authModal.classList.remove("hidden");
  }

  function closeAuthModal() {
    authModal.classList.add("hidden");
    authStatus.textContent = "";
    authStatus.classList.remove("error");
  }

  function initialFor(user) {
    const value = user?.displayName || user?.email || "G";
    return value.trim().charAt(0).toUpperCase() || "G";
  }

  function timestampToMillis(value){
    if(!value) return 0;
    if(typeof value.toMillis === "function") return value.toMillis();
    if(value.seconds) return value.seconds * 1000;
    return 0;
  }

  async function syncProgressToCloud(){
    const user = auth.currentUser;
    if(!user || !db || typeof window.pqExportProgress !== "function") return false;

    const progress = window.pqExportProgress();
    const ref = db.collection("users").doc(user.uid);

    try {
      await ref.set({
        discoveredQuestions: progress.discoveredQuestions,
        questionOrder: progress.questionOrder,
        currentIndex: progress.currentIndex,
        progressUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return true;
    } catch(error) {
      console.error("No se pudo sincronizar el progreso:", error);
      return false;
    }
  }

  window.pqSyncProgressToCloud = syncProgressToCloud;

  async function loadAndMergeProgress(user){
    if(!user || !db || typeof window.pqExportProgress !== "function") return;

    const ref = db.collection("users").doc(user.uid);

    try {
      const snap = await ref.get();
      if(!snap.exists){
        await syncProgressToCloud();
        return;
      }

      const data = snap.data() || {};

      if(typeof window.pqSetAccessPlan === "function"){
        window.pqSetAccessPlan(data.plan || "free");
      }

      const local = window.pqExportProgress();

      const cloudHasDiscovered =
        Array.isArray(data.discoveredQuestions);

      const cloudHasValidOrder =
        Array.isArray(data.questionOrder) &&
        data.questionOrder.length === (window.QUESTIONS || []).length;

      // FIRST MIGRATION ONLY:
      // If this account has never stored discoveredQuestions, preserve the
      // user's pre-login local discoveries by uploading them once.
      if(!cloudHasDiscovered){
        await syncProgressToCloud();
        return;
      }

      // From this point onward Firestore is authoritative for the account.
      // All devices receive the exact same discovered list, in the same order.
      window.pqApplyCloudProgress({
        discoveredQuestions: data.discoveredQuestions,
        questionOrder: cloudHasValidOrder ? data.questionOrder : null,
        currentIndex: Number.isFinite(Number(data.currentIndex))
          ? Number(data.currentIndex)
          : 0,
        progressUpdatedAtMillis: timestampToMillis(data.progressUpdatedAt)
      });

      // If cloud didn't yet have a valid 1000-question order, keep the local
      // order but upload it after applying the authoritative discovered list.
      if(!cloudHasValidOrder){
        await syncProgressToCloud();
      }
    } catch(error) {
      console.error("No se pudo cargar el progreso desde Firestore:", error);
    }
  }

  async function ensureUserDocument(user) {
    if (!user || !db) return false;

    const ref = db.collection("users").doc(user.uid);

    try {
      await ref.set({
        uid: user.uid,
        name: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || "",
        provider: "google",
        createdAt: user.metadata && user.metadata.creationTime
          ? firebase.firestore.Timestamp.fromDate(new Date(user.metadata.creationTime))
          : firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      window.pqUserDocRef = ref;
      window.pqFirestoreUserSaved = true;
      return true;
    } catch (error) {
      console.error("No se pudo guardar el usuario en Firestore:", error);
      window.pqFirestoreUserSaved = false;

      if (authStatus) {
        authStatus.textContent = `Sesión iniciada, pero Firestore falló: ${error.code || error.message}`;
        authStatus.classList.add("error");
      }
      return false;
    }
  }

  function renderUser(user) {
    if (user) {
      signedOutView.classList.add("hidden");
      signedInView.classList.remove("hidden");

      const initial = initialFor(user);
      accountInitial.textContent = initial;
      accountButton.classList.add("signed-in");
      userAvatar.textContent = initial;
      userName.textContent = user.displayName || "Cuenta conectada";
      userEmail.textContent = user.email || "";
      accountButton.setAttribute("aria-label", "Cuenta conectada");
      accountButton.title = user.email || "Cuenta";
    } else {
      signedInView.classList.add("hidden");
      signedOutView.classList.remove("hidden");

      accountInitial.textContent = "G";
      accountButton.classList.remove("signed-in");
      accountButton.setAttribute("aria-label", "Entrar con Google");
      accountButton.title = "Entrar";
    }
  }

  accountButton.addEventListener("click", openAuth);
  closeAuth.addEventListener("click", closeAuthModal);

  authModal.addEventListener("click", (event) => {
    if (event.target === authModal) closeAuthModal();
  });

  googleSignIn.addEventListener("click", async () => {
    authStatus.textContent = "Abriendo Google…";
    authStatus.classList.remove("error");
    googleSignIn.disabled = true;

    try {
      const provider = new firebase.auth.GoogleAuthProvider();

      const result = await auth.signInWithPopup(provider);

      if (result && result.user) {
        // Ensure Auth has a fresh token before the Firestore write.
        await result.user.getIdToken(true);
        await ensureUserDocument(result.user);
      }
      authStatus.textContent = "";
    } catch (error) {
      console.error(error);
      const friendly = {
        "auth/popup-closed-by-user": "Se cerró la ventana antes de terminar.",
        "auth/popup-blocked": "El navegador bloqueó la ventana de Google.",
        "auth/unauthorized-domain": "Este dominio todavía no está autorizado en Firebase.",
        "auth/cancelled-popup-request": "Ya había otra ventana de acceso abierta."
      };
      authStatus.textContent = friendly[error.code] || `No se pudo iniciar sesión: ${error.message}`;
      authStatus.classList.add("error");
    } finally {
      googleSignIn.disabled = false;
    }
  });

  signOutButton.addEventListener("click", async () => {
    await auth.signOut();
    closeAuthModal();
  });

  auth.onAuthStateChanged(async (user) => {
    window.pqCurrentUser = user || null;
    renderUser(user);

    if (user) {
      try {
        await user.getIdToken(true);
      } catch (tokenError) {
        console.error("No se pudo refrescar el token de Firebase Auth:", tokenError);
      }

      const saved = await ensureUserDocument(user);

      if (saved) {
        await loadAndMergeProgress(user);

        const successBox = document.querySelector(".auth-success");
        if (successBox) {
          successBox.textContent = "Cuenta conectada y progreso sincronizado.";
        }
      }
    } else {
      window.pqUserDocRef = null;
      window.pqFirestoreUserSaved = false;
    }
  });
})();
