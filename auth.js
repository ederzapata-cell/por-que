(() => {
  const auth = window.pqFirebaseAuth;
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

      const isMobile =
        /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.matchMedia("(max-width: 768px)").matches;

      if (isMobile) {
        await auth.signInWithRedirect(provider);
        return;
      }

      await auth.signInWithPopup(provider);
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

  // On mobile, Google returns to this page after redirect.
  auth.getRedirectResult().catch((error) => {
    console.error(error);
    const friendly = {
      "auth/unauthorized-domain": "Este dominio todavía no está autorizado en Firebase.",
      "auth/network-request-failed": "Hubo un problema de conexión durante el acceso con Google.",
      "auth/operation-not-allowed": "Google Sign-In no está habilitado en Firebase."
    };

    authStatus.textContent =
      friendly[error.code] || `No se pudo iniciar sesión: ${error.message}`;
    authStatus.classList.add("error");
    openAuth();
  });

  auth.onAuthStateChanged((user) => {
    window.pqCurrentUser = user || null;
    renderUser(user);
  });
})();
