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
  const emailLoginForm = document.getElementById("emailLoginForm");
  const emailLoginEmail = document.getElementById("emailLoginEmail");
  const emailLoginPassword = document.getElementById("emailLoginPassword");
  const emailLoginButton = document.getElementById("emailLoginButton");
  const passwordResetButton = document.getElementById("passwordResetButton");
  const protectPurchaseView = document.getElementById("protectPurchaseView");
  const protectPurchaseForm = document.getElementById("protectPurchaseForm");
  const protectPurchaseEmail = document.getElementById("protectPurchaseEmail");
  const protectPurchasePassword = document.getElementById("protectPurchasePassword");
  const protectPurchaseButton = document.getElementById("protectPurchaseButton");
  const protectPurchaseStatus = document.getElementById("protectPurchaseStatus");

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
      let attribution = null;
      try {
        attribution = JSON.parse(localStorage.getItem("pq_attribution") || "null");
      } catch (_) {}

      const userData = {
        uid: user.uid,
        name: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || "",
        provider: user.isAnonymous ? "anonymous" : ((user.providerData && user.providerData[0] && user.providerData[0].providerId) || "email"),
        createdAt: user.metadata && user.metadata.creationTime
          ? firebase.firestore.Timestamp.fromDate(new Date(user.metadata.creationTime))
          : firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      };

      if(attribution && attribution.first){
        userData.marketingFirstSource = attribution.first;
        userData.marketingLastSource = attribution.last || attribution.first;
      }

      await ref.set(userData, { merge: true });

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
      userName.textContent = user.isAnonymous ? "Tu acceso actual" : (user.displayName || "Cuenta conectada");
      userEmail.textContent = user.email || (user.isAnonymous ? "Compra todavía no protegida" : "");
      accountButton.setAttribute("aria-label", user.isAnonymous ? "Proteger acceso" : "Cuenta conectada");
      accountButton.title = user.email || (user.isAnonymous ? "Proteger acceso" : "Cuenta");
      if(signOutButton) signOutButton.classList.toggle("hidden", !!user.isAnonymous);
    } else {
      signedInView.classList.add("hidden");
      signedOutView.classList.remove("hidden");

      accountInitial.textContent = "G";
      accountButton.classList.remove("signed-in");
      accountButton.setAttribute("aria-label", "Entrar con Google");
      accountButton.title = "Entrar";
      if(signOutButton) signOutButton.classList.remove("hidden");
    }
  }

  function paidPlan(data){
    return data && ["100", "300", "all"].includes(data.plan);
  }

  function purchaseEmail(){
    return String(localStorage.getItem("pq_purchase_email") || "").trim().toLowerCase();
  }

  async function refreshProtectionState(user, openWhenPaid = false){
    if(!protectPurchaseView) return;
    protectPurchaseView.classList.add("hidden");
    if(!user || !user.isAnonymous || !db) return;

    try{
      const snap = await db.collection("users").doc(user.uid).get();
      const data = snap.exists ? (snap.data() || {}) : {};
      if(!paidPlan(data)) return;

      const savedEmail = purchaseEmail();
      if(protectPurchaseEmail && savedEmail) protectPurchaseEmail.value = savedEmail;
      protectPurchaseView.classList.remove("hidden");
      if(openWhenPaid) openAuth();
    }catch(error){
      console.error("No se pudo revisar la protección de compra:", error);
    }
  }

  async function waitForPaidPlan(user){
    if(!user || !user.isAnonymous || !db) return;
    for(let attempt = 0; attempt < 8; attempt += 1){
      await refreshProtectionState(user, true);
      const snap = await db.collection("users").doc(user.uid).get();
      if(snap.exists && paidPlan(snap.data() || {})) return;
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  emailLoginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = String(emailLoginEmail?.value || "").trim().toLowerCase();
    const password = String(emailLoginPassword?.value || "");
    if(!email || !password) return;

    emailLoginButton.disabled = true;
    authStatus.textContent = "Entrando…";
    authStatus.classList.remove("error");
    try{
      await auth.signInWithEmailAndPassword(email, password);
      authStatus.textContent = "";
      closeAuthModal();
    }catch(error){
      console.error(error);
      authStatus.textContent = "No pudimos entrar con ese correo y contraseña.";
      authStatus.classList.add("error");
    }finally{
      emailLoginButton.disabled = false;
    }
  });

  passwordResetButton?.addEventListener("click", async () => {
    const email = String(emailLoginEmail?.value || "").trim().toLowerCase();
    if(!email){
      authStatus.textContent = "Escribe primero tu correo.";
      authStatus.classList.add("error");
      emailLoginEmail?.focus();
      return;
    }
    try{
      await auth.sendPasswordResetEmail(email);
      authStatus.textContent = "Te enviamos un correo para crear una nueva contraseña.";
      authStatus.classList.remove("error");
    }catch(error){
      console.error(error);
      authStatus.textContent = "No pudimos enviar el correo de recuperación.";
      authStatus.classList.add("error");
    }
  });

  protectPurchaseForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const user = auth.currentUser;
    if(!user || !user.isAnonymous){
      protectPurchaseStatus.textContent = "Este acceso ya está protegido.";
      return;
    }

    const email = String(protectPurchaseEmail?.value || "").trim().toLowerCase();
    const password = String(protectPurchasePassword?.value || "");
    if(!email || password.length < 6){
      protectPurchaseStatus.textContent = "Usa un correo válido y una contraseña de mínimo 6 caracteres.";
      protectPurchaseStatus.classList.add("error");
      return;
    }

    const expectedEmail = purchaseEmail();
    if(expectedEmail && email !== expectedEmail){
      protectPurchaseStatus.textContent = "Usa el mismo correo que escribiste para la compra.";
      protectPurchaseStatus.classList.add("error");
      return;
    }

    protectPurchaseButton.disabled = true;
    protectPurchaseButton.textContent = "Protegiendo…";
    protectPurchaseStatus.textContent = "";
    protectPurchaseStatus.classList.remove("error");

    try{
      const credential = firebase.auth.EmailAuthProvider.credential(email, password);
      const result = await user.linkWithCredential(credential);
      await result.user.getIdToken(true);
      await ensureUserDocument(result.user);
      await loadAndMergeProgress(result.user);
      localStorage.removeItem("pq_purchase_email");
      localStorage.removeItem("pq_purchase_plan");
      renderUser(result.user);
      protectPurchaseView.classList.add("hidden");
      const successBox = document.querySelector(".auth-success");
      if(successBox) successBox.textContent = "Compra protegida. Ya puedes entrar con tu correo y contraseña en otros dispositivos.";
      protectPurchaseStatus.textContent = "";
    }catch(error){
      console.error(error);
      const friendly = {
        "auth/email-already-in-use": "Ese correo ya tiene una cuenta. No cierres esta sesión: contáctanos para asociar esta compra a tu cuenta existente.",
        "auth/invalid-email": "Revisa el correo.",
        "auth/weak-password": "Usa una contraseña de mínimo 6 caracteres.",
        "auth/provider-already-linked": "Este acceso ya está protegido."
      };
      protectPurchaseStatus.textContent = friendly[error.code] || "No pudimos proteger la compra. Intenta de nuevo.";
      protectPurchaseStatus.classList.add("error");
    }finally{
      protectPurchaseButton.disabled = false;
      protectPurchaseButton.textContent = "Proteger mi compra";
    }
  });

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
        await refreshProtectionState(user, false);

        const returnedFromPayment = new URLSearchParams(window.location.search).get("payment") === "return";
        if(returnedFromPayment && user.isAnonymous){
          waitForPaidPlan(user);
        }

        // If sign-in was requested from a purchase, let checkout resume.
        window.dispatchEvent(new CustomEvent("pq-auth-ready", { detail: { uid: user.uid } }));

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
