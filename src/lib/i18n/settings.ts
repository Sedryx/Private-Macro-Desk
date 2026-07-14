export type Locale = "en" | "fr";

export function resolveLocale(language?: string | null): Locale {
  return language === "fr" ? "fr" : "en";
}

export type SettingsCopy = {
  page: {
    eyebrow: string;
    title: string;
    unavailableTitle: string;
    unavailableDescription: string;
  };
  form: {
    eyebrow: string;
    title: string;
    appearance: string;
    theme: string;
    accentColor: string;
    fontSize: string;
    density: string;
    language: string;
    idle: string;
    saving: string;
    save: string;
    dark: string;
    darker: string;
    green: string;
    blue: string;
    gray: string;
    amber: string;
    red: string;
    small: string;
    normal: string;
    large: string;
    compact: string;
    comfortable: string;
    spacious: string;
    saveSuccess: string;
    saveError: string;
  };
  traders: {
    label: string;
    title: string;
    empty: string;
    save: string;
    sessionExpired: string;
    nameRequired: string;
    nameTooLong: string;
    emailRequired: string;
    emailInvalid: string;
    emailTaken: string;
    passwordRequired: string;
    passwordIncorrect: string;
    saveSuccess: string;
    migrateSuccess: string;
    saveError: string;
    emailChangeWarning: string;
    confirmPasswordLabel: string;
  };
};

const settingsCopy: Record<Locale, SettingsCopy> = {
  en: {
    page: {
      eyebrow: "Workspace / Settings",
      title: "Desk settings",
      unavailableTitle: "Settings unavailable",
      unavailableDescription: "Can't reach PostgreSQL. Start the database and check DATABASE_URL, then refresh.",
    },
    form: {
      eyebrow: "Workspace preferences",
      title: "Workspace",
      appearance: "Appearance",
      theme: "Theme",
      accentColor: "Accent color",
      fontSize: "Font size",
      density: "Density",
      language: "Language",
      idle: "Stored in PostgreSQL.",
      saving: "Saving...",
      save: "Save settings",
      dark: "Dark",
      darker: "Darker",
      green: "Green",
      blue: "Blue",
      gray: "Gray",
      amber: "Amber",
      red: "Red",
      small: "Small",
      normal: "Normal",
      large: "Large",
      compact: "Compact",
      comfortable: "Comfortable",
      spacious: "Spacious",
      saveSuccess: "Workspace settings saved.",
      saveError: "Settings could not be saved.",
    },
    traders: {
      label: "Traders",
      title: "User names",
      empty: "No users found. Run the seed.",
      save: "Save",
      sessionExpired: "Your session has expired. Please log in again.",
      nameRequired: "Name is required.",
      nameTooLong: "Name is too long.",
      emailRequired: "Email is required.",
      emailInvalid: "Enter a valid email address.",
      emailTaken: "This email is already used by another trader.",
      passwordRequired: "Enter your password to confirm this change.",
      passwordIncorrect: "Incorrect password.",
      saveSuccess: "Trader name saved.",
      migrateSuccess: "Account migrated to the new email.",
      saveError: "Trader could not be saved.",
      emailChangeWarning: "Changing the email creates a new account with the same password, moves all data over, then deletes the old one.",
      confirmPasswordLabel: "Confirm with password",
    },
  },
  fr: {
    page: {
      eyebrow: "Workspace / Réglages",
      title: "Réglages du desk",
      unavailableTitle: "Réglages indisponibles",
      unavailableDescription: "Impossible de joindre PostgreSQL. Démarre la base et vérifie DATABASE_URL, puis recharge la page.",
    },
    form: {
      eyebrow: "Préférences du workspace",
      title: "Workspace",
      appearance: "Apparence",
      theme: "Thème",
      accentColor: "Couleur d'accent",
      fontSize: "Taille du texte",
      density: "Densité",
      language: "Langue",
      idle: "Stocké dans PostgreSQL.",
      saving: "Sauvegarde...",
      save: "Sauvegarder",
      dark: "Sombre",
      darker: "Très sombre",
      green: "Vert",
      blue: "Bleu",
      gray: "Gris",
      amber: "Ambre",
      red: "Rouge",
      small: "Petit",
      normal: "Normal",
      large: "Grand",
      compact: "Compact",
      comfortable: "Confortable",
      spacious: "Spacieux",
      saveSuccess: "Réglages sauvegardés.",
      saveError: "Impossible de sauvegarder les réglages.",
    },
    traders: {
      label: "Traders",
      title: "Noms des utilisateurs",
      empty: "Aucun utilisateur trouvé. Lance le seed.",
      save: "Sauver",
      sessionExpired: "Session expirée. Reconnecte-toi.",
      nameRequired: "Le nom est obligatoire.",
      nameTooLong: "Nom trop long.",
      emailRequired: "L'email est obligatoire.",
      emailInvalid: "Entre une adresse email valide.",
      emailTaken: "Cet email est déjà utilisé par un autre trader.",
      passwordRequired: "Entre ton mot de passe pour confirmer ce changement.",
      passwordIncorrect: "Mot de passe incorrect.",
      saveSuccess: "Nom du trader sauvegardé.",
      migrateSuccess: "Compte migré vers la nouvelle adresse email.",
      saveError: "Impossible de sauvegarder le trader.",
      emailChangeWarning: "Changer l'email crée un nouveau compte avec le même mot de passe, transfère toutes les données, puis supprime l'ancien.",
      confirmPasswordLabel: "Confirmer avec le mot de passe",
    },
  },
};

export function getSettingsCopy(language?: string | null): SettingsCopy {
  return settingsCopy[resolveLocale(language)];
}
