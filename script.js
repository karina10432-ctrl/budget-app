// ה"מצב" (state) של האפליקציה - כל הנתונים שלנו יושבים כאן, במקום אחד.
// שימי לב: זה עם let ולא const - כי בעוד רגע (loadData) אנחנו עשויות להחליף
// את כל האובייקט הזה בנתונים שנטענו מה-localStorage.
let budgetData = {
  // רשימה של מקורות הכנסה - { id, name, amount } - במקום salary/other קבועים.
  // ensureBackwardCompatibleFields() ממירה אוטומטית נתונים ישנים בפורמט salary/other לרשימה כזו.
  income: {
    sources: [{ id: 1, name: "משכורת", amount: 8000 }],
  },
  expensesFixed: {
    rent: 0,
    arnona: 0,
    electricity: 0,
    water: 0,
    vaad: 0,
    internet: 0,
    phone: 0,
    insurance: 0,
    subscriptions: 0,
  },
  expensesVariable: {
    super: 0,
    restaurants: 0,
    transport: 0,
    car: 0,
    shopping: 0,
    fun: 0,
    health: 0,
    other: 0,
  },
  // תקציב חודשי מתוכנן, רק לקטגוריות המשתנות. 0 אומר "לא הוגדר תקציב"
  budgets: {
    super: 0,
    restaurants: 0,
    transport: 0,
    car: 0,
    shopping: 0,
    fun: 0,
    health: 0,
    other: 0,
  },
  // כל מטרת חיסכון היא אובייקט עם שם, סכום יעד, כמה נחסך, והפקדה חודשית מתוכננת.
  // "כמה חסכתי בסה"כ" בדשבורד מחושב מהסכום של כל ה-saved כאן, ולא מספר קבוע יותר.
  savingsGoals: [],
  // כל חודש שסוגרים נשמר כאן כ"תמונת מצב" - כדי שאפשר יהיה לראות היסטוריה
  history: [],
  // אירועי לוח השנה הפיננסי (משכורות, חשבונות וכו') - חד-פעמיים או חוזרים כל חודש
  calendarEvents: [],
  // יתרה נוכחית - מוזנת ידנית ע"י המשתמשת, לא מחושבת אוטומטית מהכנסות/הוצאות
  currentBalance: 0,
  // הוצאות מהירות - קיצורי דרך אישיים (כמו "קפה - 15₪") שמוסיפים הוצאה רגילה בלחיצה אחת.
  // כל אחת היא { id, name, amount, type: "fixed"|"variable", category: <key מ-fixedFields/variableFields> }.
  // זה לא מערכת הוצאות נפרדת - לחיצה על "+" רק מוסיפה את הסכום לקטגוריה הקיימת ב-expensesFixed/expensesVariable.
  quickExpenses: [],
};

// שמות החודשים בעברית, לפי המספר שמחזיר new Date().getMonth() (0 = ינואר)
const monthNames = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

// מחזירה טקסט כמו "ספטמבר 2026", לפי התאריך האמיתי של היום
function getCurrentMonthLabel() {
  const now = new Date();
  return monthNames[now.getMonth()] + " " + now.getFullYear();
}

// רשימות שמקשרות בין ה-id של כל שדה בטופס לבין השם שלו ב-budgetData.
// כך אפשר לעבור בלולאה על כל השדות, במקום לכתוב שורה נפרדת לכל קטגוריה.
// הוספתי label ו-icon לכל שדה (גם קבועות וגם משתנות) - בשביל שלב 15 (גרפים).
// זו רק תוספת מידע לתצוגה - לא נגעתי ב-id/key הקיימים, אז שום קוד קיים שמשתמש בהם לא מושפע.
const fixedFields = [
  { id: "exp-rent", key: "rent", label: "שכר דירה", icon: "🏠" },
  { id: "exp-arnona", key: "arnona", label: "ארנונה", icon: "🧾" },
  { id: "exp-electricity", key: "electricity", label: "חשמל", icon: "💡" },
  { id: "exp-water", key: "water", label: "מים", icon: "💧" },
  { id: "exp-vaad", key: "vaad", label: "ועד בית", icon: "🏢" },
  { id: "exp-internet", key: "internet", label: "אינטרנט", icon: "🌐" },
  { id: "exp-phone", key: "phone", label: "טלפון", icon: "📱" },
  { id: "exp-insurance", key: "insurance", label: "ביטוחים", icon: "🛡️" },
  { id: "exp-subscriptions", key: "subscriptions", label: "מנויים", icon: "📺" },
];

// הוספתי label (שם בעברית) לכל שדה - נשתמש בו בטבלת התקציבים,
// כדי לא לכתוב שוב את שם הקטגוריה בנפרד ב-JavaScript. icon נוסף בשלב 15 (גרפים).
const variableFields = [
  { id: "exp-super", key: "super", label: "סופר", icon: "🛒" },
  { id: "exp-restaurants", key: "restaurants", label: "מסעדות ואוכל בחוץ", icon: "🍽️" },
  { id: "exp-transport", key: "transport", label: "תחבורה", icon: "🚌" },
  { id: "exp-car", key: "car", label: "רכב", icon: "🚗" },
  { id: "exp-shopping", key: "shopping", label: "קניות", icon: "🛍️" },
  { id: "exp-fun", key: "fun", label: "בילויים", icon: "🎉" },
  { id: "exp-health", key: "health", label: "בריאות", icon: "🏥" },
  { id: "exp-other", key: "other", label: "שונות", icon: "📦" },
];

// פונקציה קטנה שמעצבת מספר כסף עם ₪ ופסיקים (למשל 8000 -> ₪8,000).
// מספרים עשרוניים מוצגים עם עד 2 ספרות אחרי הנקודה (מעוגל), בלי לפגוע בהצגת מספרים שלמים
// (minimumFractionDigits: 0 מונע ".00" מיותר על סכומים עגולים).
function formatMoney(amount) {
  return "₪" + amount.toLocaleString("he-IL", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ממירה ערך גולמי משדה טופס (מחרוזת) למספר לא-שלילי, לשימוש לפני שמירה ל-budgetData.
// קלט ריק/לא מספרי -> 0 (בדיוק כמו ההתנהגות הקודמת של Number(...) || 0).
// מספר שלילי -> null, כדי שקוד הטופס הקורא יוכל לחסום את השמירה ולהציג הודעה למשתמשת,
// במקום להסתמך רק על min="0" של ה-HTML (שלא נאכף בפועל כשקוראים .value ישירות).
function parseNonNegativeAmount(rawValue) {
  if (rawValue === "" || rawValue === null || rawValue === undefined) {
    return 0;
  }
  const num = Number(rawValue);
  if (!isFinite(num)) {
    return 0;
  }
  if (num < 0) {
    return null;
  }
  return num;
}

// ההודעה האחידה שמוצגת כשמנסים לשמור סכום שלילי בכל טופס כספי באפליקציה
const NEGATIVE_AMOUNT_MESSAGE = "אי אפשר להזין סכום שלילי. נא לתקן ולנסות שוב.";

// שומרת את budgetData בזיכרון הקבוע של הדפדפן (localStorage).
// localStorage יודע לשמור רק טקסט, אז JSON.stringify הופך את האובייקט שלנו לטקסט.
function saveData() {
  localStorage.setItem("budgetAppData", JSON.stringify(budgetData));
}

// בטעינת הדף: בודקת אם יש נתונים שמורים מפעם קודמת, ואם כן - טוענת אותם
// במקום נתוני הדוגמה. JSON.parse עושה את הפעולה ההפוכה מ-stringify.
function loadData() {
  const saved = localStorage.getItem("budgetAppData");
  if (saved) {
    budgetData = JSON.parse(saved);
  }
}

// טוענות נתונים שמורים (אם יש) לפני שממשיכות
loadData();

// ממירה income בפורמט ישן (salary/other קבועים) למערך sources - בלי לאבד אף ערך, כולל 0,
// כדי שנתונים קיימים ימשיכו לעבוד גם אחרי השדרוג למקורות הכנסה מרובים.
// לא נוגעת ב-sources קיים ותקין - נקראת רק כשהוא לא קיים (ר' ensureBackwardCompatibleFields).
function migrateLegacyIncomeToSources(income) {
  const salary = income && typeof income.salary === "number" && isFinite(income.salary) ? income.salary : 0;
  const other = income && typeof income.other === "number" && isFinite(income.other) ? income.other : 0;
  return [
    { id: Date.now(), name: "משכורת", amount: Math.max(0, salary) },
    { id: Date.now() + 1, name: "הכנסה נוספת", amount: Math.max(0, other) },
  ];
}

// בודקת שלכל השדות שהוספנו במהלך הדרך (תקציבים, מטרות, היסטוריה, לוח שנה, מקורות הכנסה)
// יש ברירת מחדל, גם אם budgetData הגיע מגיבוי ישן שנוצר לפני שהם היו קיימים.
// זה מונע קריסה כשהקוד מנסה לקרוא, למשל, budgets.super ממקום שלא קיים.
// הפונקציה הזו רצה גם בטעינת הדף וגם אחרי ייבוא גיבוי.
function ensureBackwardCompatibleFields() {
  // income.sources הוא הפורמט הנוכחי - אם הוא לא קיים, זה כנראה גיבוי ישן עם salary/other
  if (!budgetData.income || !Array.isArray(budgetData.income.sources)) {
    budgetData.income = { sources: migrateLegacyIncomeToSources(budgetData.income) };
  }
  if (!budgetData.budgets) {
    budgetData.budgets = {
      super: 0,
      restaurants: 0,
      transport: 0,
      car: 0,
      shopping: 0,
      fun: 0,
      health: 0,
      other: 0,
    };
  }
  if (!budgetData.savingsGoals) {
    budgetData.savingsGoals = [];
  }
  if (!budgetData.history) {
    budgetData.history = [];
  }
  if (!budgetData.calendarEvents) {
    budgetData.calendarEvents = [];
  }
  if (typeof budgetData.currentBalance !== "number") {
    budgetData.currentBalance = 0;
  }
  if (!Array.isArray(budgetData.quickExpenses)) {
    budgetData.quickExpenses = [];
  }
  // הוצאות מהירות ישנות (מלפני שהוספנו מעקב שימוש) - נותנות להן מונים ריקים כברירת מחדל
  budgetData.quickExpenses.forEach((qe) => {
    if (typeof qe.usageCount !== "number" || !isFinite(qe.usageCount)) {
      qe.usageCount = 0;
    }
    if (typeof qe.usageTotal !== "number" || !isFinite(qe.usageTotal)) {
      qe.usageTotal = 0;
    }
  });
  // אם יש שורות היסטוריה ישנות בלי id (מלפני שהוספנו מחיקה) - נוסיף להן אחד
  budgetData.history.forEach((entry, index) => {
    if (!entry.id) {
      entry.id = Date.now() + index;
    }
  });
}

ensureBackwardCompatibleFields();

// מחשבת כמה מההוצאות קבועות, כמה משתנות, וכמה בסך הכל
function calculateExpensesBreakdown() {
  let fixedTotal = 0;
  fixedFields.forEach((field) => {
    fixedTotal += budgetData.expensesFixed[field.key];
  });

  let variableTotal = 0;
  variableFields.forEach((field) => {
    variableTotal += budgetData.expensesVariable[field.key];
  });

  return {
    fixedTotal: fixedTotal,
    variableTotal: variableTotal,
    total: fixedTotal + variableTotal,
  };
}

// מסכמת את ההפקדה החודשית המתוכננת מכל מטרות החיסכון - זה מה שכרטיס
// "חיסכון" בדשבורד מציג (כמה מתכוונת להפקיד החודש), ולא "כמה כבר נחסך בסה"כ"
// (זה מוצג בנפרד, בתוך כרטיס המטרה עצמו).
function calculateTotalSavings() {
  let total = 0;
  budgetData.savingsGoals.forEach((goal) => {
    total += goal.monthlyDeposit;
  });
  return total;
}

// מסכמת את ההכנסה הכוללת מכל מקורות ההכנסה (budgetData.income.sources) - הפונקציה המרכזית
// היחידה שמחשבת הכנסה כוללת באפליקציה. כל מקום אחר (Dashboard, סיכום חודשי, תקציב יומי,
// סגירת חודש וכו') קורא לה במקום לחשב הכנסה בעצמו, כדי שהוספת/עריכת/מחיקת מקור תתעדכן בכל מקום.
function calculateTotalIncome() {
  return budgetData.income.sources.reduce((sum, source) => sum + source.amount, 0);
}

// מסכמת את התקציב הכולל ואת ההוצאה בפועל הכוללת, על פני כל קטגוריות ההוצאה המשתנות
// (משתמשת ב-budgetData.budgets/expensesVariable הקיימים - לא מגדירה מערכת תקציב חדשה).
// זה חישוב חדש כי עד עכשיו לא היה אף מקום שמסכם את זה - renderBudgetTable מציגה per-קטגוריה בלבד.
function calculateBudgetUsage() {
  let totalBudget = 0;
  let totalActual = 0;
  variableFields.forEach((field) => {
    totalBudget += budgetData.budgets[field.key];
    totalActual += budgetData.expensesVariable[field.key];
  });
  return { totalBudget: totalBudget, totalActual: totalActual };
}

// מציגה את הנתונים העדכניים מ-budgetData ב-4 כרטיסי ה-Dashboard
function renderDashboard() {
  const totalIncome = calculateTotalIncome();
  const expenses = calculateExpensesBreakdown();
  const totalSavings = calculateTotalSavings();
  const remaining = totalIncome - expenses.total - totalSavings;

  document.getElementById("income-value").textContent = formatMoney(totalIncome);
  document.getElementById("expenses-value").textContent = formatMoney(expenses.total);
  document.getElementById("savings-value").textContent = formatMoney(totalSavings);
  document.getElementById("remaining-value").textContent = formatMoney(remaining);

  // שורת הפירוט: כמה מההוצאות קבועות וכמה משתנות
  document.getElementById("expenses-breakdown").textContent =
    "קבועות " + formatMoney(expenses.fixedTotal) + " · משתנות " + formatMoney(expenses.variableTotal);

  renderBudgetTable();
  renderSpendingLimitCard(totalIncome, expenses.total, totalSavings, remaining);

  // מרעננת גם את "סיכום החודש" (שלב 14) - כי היא מתבססת על אותם נתונים בדיוק,
  // וכך היא מתעדכנת אוטומטית בכל מקום שבו renderDashboard() כבר נקראת
  // (הוספת/עריכת/מחיקת הכנסה או הוצאה, שינוי תקציב, סגירת חודש, ייבוא, טעינת הדף)
  renderMonthSummaryCard();

  // ואת שני הגרפים (שלב 15) - מאותה הסיבה בדיוק, ובאותה נקודת חיבור יחידה
  renderExpenseBreakdownChart();
  renderBudgetComparisonChart();

  // וגם את כרטיס "לאן הכסף הולך החודש" ב-Home (שלב UI-2d) - אותה סיבה, אותה נקודת חיבור
  renderHomeExpenseBreakdown();
}

// מחזירה כמה ימים יש בסך הכל בחודש הנוכחי, ומה היום הנוכחי בחודש (1-31)
function getDaysInfo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 = ינואר

  // טריק נחמד: "היום ה-0" של החודש הבא הוא בעצם היום האחרון של החודש הנוכחי
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  return {
    today: today,
    daysInMonth: daysInMonth,
    daysLeft: daysInMonth - today + 1, // +1 כדי לספור גם את היום הנוכחי
  };
}

// מחשבת ומציגה את כרטיס "מותר להוציא היום"
function renderSpendingLimitCard(totalIncome, expensesTotal, totalSavings, remaining) {
  const days = getDaysInfo();
  const card = document.getElementById("spending-limit-card");
  const valueEl = document.getElementById("spending-limit-value");
  const breakdownEl = document.getElementById("spending-limit-breakdown");

  if (remaining <= 0) {
    // חרגנו מהתקציב החודשי - מציגות הודעה ברורה במקום סכום יומי
    card.classList.add("over-budget");
    valueEl.textContent = "⚠️ חריגה מהתקציב";
    breakdownEl.textContent = "חרגת ב-" + formatMoney(Math.abs(remaining)) + " מהתקציב החודשי";
    return;
  }

  card.classList.remove("over-budget");

  const dailyAllowance = remaining / days.daysLeft;

  // "בקצב הנוכחי": מסתכלות על ההוצאות שהוזנו עד עכשיו, מחשבות ממוצע ליום,
  // ומשליכות אותו על כל החודש כדי להעריך כמה יישאר בסוף
  const daysElapsed = days.today;
  const averageDailySpendSoFar = expensesTotal / daysElapsed;
  const projectedTotalExpenses = averageDailySpendSoFar * days.daysInMonth;
  const projectedRemaining = totalIncome - projectedTotalExpenses - totalSavings;

  valueEl.textContent = formatMoney(Math.round(dailyAllowance));
  breakdownEl.textContent =
    days.daysLeft + " ימים נשארו · בקצב הנוכחי צפוי להישאר: " + formatMoney(Math.round(projectedRemaining));
}

// מציגה את "סיכום החודש" (שלב 14) - תצוגה מרוכזת בלבד, בלי שום חישוב כספי חדש:
// הכנסה/הוצאות/חיסכון/נשאר מגיעים מאותן פונקציות בדיוק כמו renderDashboard(),
// ימי החודש מגיעים מ-getDaysInfo() הקיימת (שלב 12), ותקציב מגיע מ-calculateBudgetUsage() החדשה.
function renderMonthSummaryCard() {
  const totalIncome = calculateTotalIncome();
  const expenses = calculateExpensesBreakdown();
  const totalSavings = calculateTotalSavings();
  const remaining = totalIncome - expenses.total - totalSavings;

  document.getElementById("month-summary-income").textContent = formatMoney(totalIncome);
  document.getElementById("month-summary-expenses").textContent = formatMoney(expenses.total);
  document.getElementById("month-summary-savings").textContent = formatMoney(totalSavings);
  document.getElementById("month-summary-remaining").textContent = formatMoney(remaining);

  // התקדמות החודש - לפי getDaysInfo() הקיימת, בלי חישוב תאריכים חדש
  const days = getDaysInfo();
  document.getElementById("month-days-label").textContent =
    "📅 עברו " + days.today + " מתוך " + days.daysInMonth + " ימים";
  const daysPercent = Math.min(100, (days.today / days.daysInMonth) * 100);
  document.getElementById("month-days-progress-fill").style.width = daysPercent + "%";

  // ניצול תקציב ההוצאות - לפי calculateBudgetUsage() (מבוססת על budgetData.budgets/expensesVariable הקיימים)
  const budgetUsage = calculateBudgetUsage();
  const budgetLabelEl = document.getElementById("month-budget-label");
  const budgetFillEl = document.getElementById("month-budget-progress-fill");
  const paceLineEl = document.getElementById("month-pace-line");

  if (budgetUsage.totalBudget === 0) {
    // אין תקציבים מוגדרים בכלל - לא מציגות אחוז, ולא מחשבות קצב (כדי לא לחלק ב-0)
    budgetLabelEl.textContent = "🎯 אין תקציב מוגדר";
    budgetFillEl.style.width = "0%";
    budgetFillEl.classList.remove("fill-danger");

    paceLineEl.textContent = "אין תקציב מוגדר כדי להשוות אליו את קצב ההוצאות";
    paceLineEl.className = "month-pace-line pace-neutral";
    return;
  }

  const budgetPercent = (budgetUsage.totalActual / budgetUsage.totalBudget) * 100;
  const isOverBudget = budgetPercent > 100;

  budgetLabelEl.textContent =
    "🎯 " + Math.round(budgetPercent) + "% מתקציב ההוצאות נוצל" + (isOverBudget ? " - חריגה!" : "");
  budgetFillEl.style.width = Math.min(100, budgetPercent) + "%";
  budgetFillEl.classList.toggle("fill-danger", isOverBudget);

  // קצב הוצאות - השוואה תיאורית בלבד בין % הימים שעברו ל-% התקציב שנוצל.
  // לא תחזית חדשה ולא חישוב כספי - רק תיאור של איפה עומדים ביחס לקצב הצפוי.
  // טווח סטייה של 15 נקודות אחוז נחשב "בקצב תקין" (לא קטן/גדול מדי).
  const paceDiff = budgetPercent - daysPercent;
  if (paceDiff > 15) {
    paceLineEl.textContent = "⚠️ קצב ההוצאות גבוה מקצב החודש";
    paceLineEl.className = "month-pace-line pace-warning";
  } else if (paceDiff < -15) {
    paceLineEl.textContent = "✅ ההוצאות כרגע מתחת לקצב החודש";
    paceLineEl.className = "month-pace-line pace-good";
  } else {
    paceLineEl.textContent = "📈 קצב ההוצאות נראה תקין";
    paceLineEl.className = "month-pace-line pace-steady";
  }
}

// ===== גרפים ויזואליים להוצאות (שלב 15) =====
// שתי הפונקציות הבאות קוראות בלבד מהנתונים הקיימים (expensesFixed/expensesVariable/budgets) -
// הן לא שומרות שום מידע משלהן ולא יוצרות מערכת הוצאות מקבילה.

// מחזירה רשימת כל הקטגוריות (קבועות ומשתנות יחד) שיש בהן הוצאה בפועל גדולה מ-0,
// ממוינת מהגדולה לקטנה. משמשת את גרף "לאן הכסף הולך".
function getExpenseCategoryList() {
  const list = [];

  fixedFields.forEach((field) => {
    const amount = budgetData.expensesFixed[field.key];
    if (amount > 0) {
      list.push({ label: field.label, icon: field.icon, amount: amount });
    }
  });

  variableFields.forEach((field) => {
    const amount = budgetData.expensesVariable[field.key];
    if (amount > 0) {
      list.push({ label: field.label, icon: field.icon, amount: amount });
    }
  });

  list.sort((a, b) => b.amount - a.amount);
  return list;
}

// פלטת הצבעים לגרף - רק צבעים שכבר מוגדרים ב-:root, בלי להמציא צבעים חדשים.
// כדי לתמוך גם ביותר מ-4 קטגוריות בו-זמנית, חוזרות על הצבעים עם שקיפות מופחתת בכל "סיבוב" נוסף.
const donutChartColors = ["var(--color-primary)", "var(--color-savings)", "var(--color-income)", "var(--color-expenses)"];
function getSliceColor(index) {
  const baseColor = donutChartColors[index % donutChartColors.length];
  const roundNumber = Math.floor(index / donutChartColors.length);
  const opacity = roundNumber % 2 === 0 ? 1 : 0.55;
  return { color: baseColor, opacity: opacity };
}

// מציירת דונאט SVG פשוט (בלי ספריות חיצוניות) + רשימת מקרא, לפי getExpenseCategoryList().
// טכניקת ה-SVG: מעגל עם רדיוס שההיקף שלו הוא בדיוק 100, כך שאחוז הופך ישירות ל-stroke-dasharray.
function renderExpenseBreakdownChart() {
  const chartContainer = document.getElementById("expense-breakdown-chart");
  const listContainer = document.getElementById("expense-breakdown-list");

  const categories = getExpenseCategoryList();

  if (categories.length === 0) {
    chartContainer.innerHTML = "";
    listContainer.innerHTML = '<div class="cashflow-empty">אין עדיין הוצאות להצגה</div>';
    return;
  }

  const total = categories.reduce((sum, cat) => sum + cat.amount, 0);
  const radius = 15.9155; // כך שההיקף (2 * π * r) יוצא בדיוק 100

  let svg = '<svg viewBox="0 0 36 36" class="donut-chart">';
  svg += '<circle class="donut-chart-bg" cx="18" cy="18" r="' + radius + '"></circle>';

  let cumulativePercent = 0;
  categories.forEach((cat, index) => {
    const percent = (cat.amount / total) * 100;
    const slice = getSliceColor(index);
    // 25 = רבע מההיקף (100/4) - מזיז את נקודת ההתחלה מ-3 בשעון (ברירת המחדל) ל-12 בשעון
    const dashOffset = 25 - cumulativePercent;

    svg +=
      '<circle class="donut-chart-slice" cx="18" cy="18" r="' + radius + '" ' +
      'stroke="' + slice.color + '" stroke-opacity="' + slice.opacity + '" ' +
      'stroke-dasharray="' + percent + " " + (100 - percent) + '" ' +
      'stroke-dashoffset="' + dashOffset + '"></circle>';

    cumulativePercent += percent;
  });

  svg += "</svg>";
  chartContainer.innerHTML = svg;

  listContainer.innerHTML = "";
  categories.forEach((cat, index) => {
    const percent = Math.round((cat.amount / total) * 100);
    const slice = getSliceColor(index);

    const row = document.createElement("div");
    row.className = "legend-row";

    const dot = document.createElement("span");
    dot.className = "legend-dot";
    dot.style.backgroundColor = slice.color;
    dot.style.opacity = slice.opacity;

    const textSpan = document.createElement("span");
    textSpan.className = "legend-text";
    textSpan.textContent = cat.icon + " " + cat.label;

    const amountSpan = document.createElement("span");
    amountSpan.className = "legend-amount";
    amountSpan.textContent = formatMoney(cat.amount) + " · " + percent + "%";

    row.appendChild(dot);
    row.appendChild(textSpan);
    row.appendChild(amountSpan);
    listContainer.appendChild(row);
  });
}

// כמה קטגוריות להציג לכל היותר בכרטיס הקומפקטי "לאן הכסף הולך החודש" ב-Home (UI-2d),
// לפני שמציגות שורת "+ עוד X קטגוריות" - כדי שהכרטיס לא יתפח לכרטיס ענק
const HOME_EXPENSE_BREAKDOWN_LIMIT = 5;

// מציגה בכרטיס הקומפקטי של Home את פירוט ההוצאות לפי קטגוריה (שלב UI-2d) - קריאה-בלבד,
// לא שומרת שום נתון. משתמשת אך ורק בתוצאה של getExpenseCategoryList() הקיימת (אותה
// פונקציה שכבר מזינה את גרף הדונאט למעלה) - לא מחשבת קטגוריות/אחוזים מהתחלה בעצמה,
// רק גוזרת אחוז תצוגה מהסכומים שהיא כבר החזירה. זו לא "הוצאות אחרונות" - אין כאן תאריכים,
// כי המבנה הקיים (expensesFixed/expensesVariable) לא שומר הוצאות בודדות עם תאריך.
function renderHomeExpenseBreakdown() {
  const container = document.getElementById("home-expense-breakdown-list");
  container.innerHTML = "";

  const categories = getExpenseCategoryList();

  if (categories.length === 0) {
    container.innerHTML = '<div class="cashflow-empty">אין עדיין הוצאות להצגה החודש</div>';
    return;
  }

  const total = categories.reduce((sum, cat) => sum + cat.amount, 0);
  const topCategories = categories.slice(0, HOME_EXPENSE_BREAKDOWN_LIMIT);

  topCategories.forEach((cat) => {
    const percent = Math.round((cat.amount / total) * 100);

    const row = document.createElement("div");
    row.className = "budget-compare-row";

    const headerDiv = document.createElement("div");
    headerDiv.className = "budget-compare-header";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = cat.icon + " " + cat.label;

    const amountSpan = document.createElement("span");
    amountSpan.className = "budget-compare-amounts";
    amountSpan.textContent = formatMoney(cat.amount) + " · " + percent + "%";

    headerDiv.appendChild(nameSpan);
    headerDiv.appendChild(amountSpan);
    row.appendChild(headerDiv);

    const track = document.createElement("div");
    track.className = "progress-bar-track";
    const fill = document.createElement("div");
    fill.className = "progress-bar-fill";
    fill.style.width = percent + "%";
    track.appendChild(fill);
    row.appendChild(track);

    container.appendChild(row);
  });

  const remainingCount = categories.length - topCategories.length;
  if (remainingCount > 0) {
    const moreNote = document.createElement("div");
    moreNote.className = "cashflow-empty";
    moreNote.textContent = "+ עוד " + remainingCount + " קטגוריות";
    container.appendChild(moreNote);
  }
}

// מחזירה את כל הקטגוריות המשתנות (רק אלה - התקציבים קיימים רק עבורן, בדיוק כמו בטבלת
// התקציבים הקיימת) שיש להן תקציב או הוצאה בפועל גדולים מ-0. משמשת את גרף "תקציב מול בפועל".
function getBudgetComparisonList() {
  const list = [];

  variableFields.forEach((field) => {
    const budget = budgetData.budgets[field.key];
    const actual = budgetData.expensesVariable[field.key];
    if (budget > 0 || actual > 0) {
      list.push({ label: field.label, icon: field.icon, budget: budget, actual: actual });
    }
  });

  return list;
}

// מציגה שורה לכל קטגוריה עם פס תקציב-מול-בפועל, לפי getBudgetComparisonList().
// משתמשת מחדש ב-.progress-bar-track/.progress-bar-fill/.fill-danger הקיימים.
function renderBudgetComparisonChart() {
  const container = document.getElementById("budget-comparison-list");
  container.innerHTML = "";

  const categories = getBudgetComparisonList();

  if (categories.length === 0) {
    container.innerHTML = '<div class="cashflow-empty">אין עדיין תקציבים להצגה</div>';
    return;
  }

  categories.forEach((cat) => {
    const row = document.createElement("div");
    row.className = "budget-compare-row";

    const headerDiv = document.createElement("div");
    headerDiv.className = "budget-compare-header";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = cat.icon + " " + cat.label;

    const amountsSpan = document.createElement("span");
    amountsSpan.className = "budget-compare-amounts";

    headerDiv.appendChild(nameSpan);
    headerDiv.appendChild(amountsSpan);
    row.appendChild(headerDiv);

    if (cat.budget === 0) {
      // אין תקציב מוגדר לקטגוריה הזו - מציגות רק את הסכום בפועל, בלי לחלק ב-0
      amountsSpan.textContent = "בפועל: " + formatMoney(cat.actual) + " · אין תקציב מוגדר";
    } else {
      amountsSpan.textContent = "תקציב: " + formatMoney(cat.budget) + " · בפועל: " + formatMoney(cat.actual);

      const track = document.createElement("div");
      track.className = "progress-bar-track";

      const percent = (cat.actual / cat.budget) * 100;
      const isOver = percent > 100;

      const fill = document.createElement("div");
      fill.className = "progress-bar-fill" + (isOver ? " fill-danger" : "");
      fill.style.width = Math.min(100, percent) + "%";

      track.appendChild(fill);
      row.appendChild(track);

      if (isOver) {
        const overNote = document.createElement("div");
        overNote.className = "budget-compare-over-note";
        overNote.textContent = "⚠️ חריגה של " + formatMoney(cat.actual - cat.budget);
        row.appendChild(overNote);
      }
    }

    container.appendChild(row);
  });
}

// בונה מחדש את טבלת "מתוכנן / בפועל / נשאר", שורה לכל קטגוריית הוצאה משתנה
function renderBudgetTable() {
  const tableBody = document.getElementById("budget-table-body");
  tableBody.innerHTML = ""; // מוחקת שורות ישנות לפני שבונים מחדש

  variableFields.forEach((field) => {
    const planned = budgetData.budgets[field.key];
    const actual = budgetData.expensesVariable[field.key];
    const remaining = planned - actual;

    const row = document.createElement("tr");

    // אם הוגדר תקציב (planned > 0) והוא נחצה - מדגישים את השורה באדום
    if (planned > 0 && remaining < 0) {
      row.classList.add("over-budget");
    }

    row.innerHTML =
      "<td>" + field.label + "</td>" +
      "<td>" + formatMoney(planned) + "</td>" +
      "<td>" + formatMoney(actual) + "</td>" +
      "<td>" + formatMoney(remaining) + "</td>";

    tableBody.appendChild(row);
  });
}

// בונה מחדש את כל כרטיסי מטרות החיסכון, אחד לכל מטרה ברשימה budgetData.savingsGoals
function renderSavingsGoals() {
  const container = document.getElementById("goals-list");
  container.innerHTML = "";

  budgetData.savingsGoals.forEach((goal) => {
    const remaining = goal.target - goal.saved;
    const percent = goal.target > 0 ? Math.min(100, (goal.saved / goal.target) * 100) : 0;

    let etaText;
    if (remaining <= 0) {
      etaText = "🎉 הגעת למטרה!";
    } else if (goal.monthlyDeposit > 0) {
      const months = Math.ceil(remaining / goal.monthlyDeposit);
      etaText = "בקצב הזה, תגיעי למטרה בעוד כ-" + months + " חודשים";
    } else {
      etaText = "הוסיפי הפקדה חודשית כדי לראות הערכת זמן";
    }

    const card = document.createElement("div");
    card.className = "goal-card";
    card.innerHTML =
      '<div class="goal-header">' +
      '<span class="goal-name">' + goal.name + "</span>" +
      '<button class="goal-delete" data-id="' + goal.id + '" aria-label="מחק יעד חיסכון">🗑️</button>' +
      "</div>" +
      '<div class="progress-bar-track">' +
      '<div class="progress-bar-fill" style="width:' + percent + '%"></div>' +
      "</div>" +
      '<div class="goal-stats">' +
      "<span>נחסך " + formatMoney(goal.saved) + " מתוך " + formatMoney(goal.target) + "</span>" +
      "<span>נשאר " + formatMoney(Math.max(0, remaining)) + "</span>" +
      "</div>" +
      '<div class="goal-eta">' + etaText + "</div>" +
      buildGoalPaceSectionHtml(goal) +
      '<button type="button" class="goal-sim-toggle-button secondary-button" data-id="' + goal.id + '">' +
      "🔮 מה יקרה אם אחסוך..." +
      "</button>" +
      '<div class="goal-sim-reveal" style="display: none;">' +
      '<div class="goal-sim-presets">' +
      [500, 1000, 1500, 2000, 3000]
        .map(
          (amount) =>
            '<button type="button" class="goal-sim-amount-button secondary-button" data-id="' +
            goal.id +
            '" data-amount="' +
            amount +
            '">' +
            formatMoney(amount) +
            "</button>"
        )
        .join("") +
      "</div>" +
      '<div class="goal-sim-custom-row">' +
      '<input type="number" class="goal-sim-custom-input" min="0" placeholder="סכום חיסכון חודשי אחר">' +
      '<button type="button" class="goal-sim-custom-button secondary-button" data-id="' + goal.id + '">חשב</button>' +
      "</div>" +
      '<div class="goal-sim-result"></div>' +
      "</div>";

    container.appendChild(card);
  });
}

// פותחת מחרוזת "YYYY-MM-DD" (כמו שמגיעה מ-input type="date") לתאריך בזמן מקומי,
// כדי לא להיתקל בהפרש של יום שיכול לקרות עם new Date("YYYY-MM-DD") (שמתפרש כ-UTC)
function parseDateInputValue(dateString) {
  const parts = dateString.split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

// מחשבת את "מצב החיסכון החכם" למטרה נתונה - נשען כולו על goal.target/saved/monthlyDeposit/targetDate
// הקיימים. לא יוצר או שומר שום נתון חדש - רק מחשב ומחזיר.
function calculateGoalPace(goal) {
  const remaining = Math.max(0, goal.target - goal.saved);

  if (remaining <= 0) {
    return { reached: true };
  }

  const now = new Date();
  let monthsRemaining = null;
  let isOverdue = false;
  let requiredMonthly = null;

  if (goal.targetDate) {
    const target = parseDateInputValue(goal.targetDate);
    // הפרש בחודשים קלנדריים בין החודש הנוכחי לחודש היעד (לא סופרים ימים בודדים)
    monthsRemaining = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());

    if (monthsRemaining < 0) {
      isOverdue = true;
    } else {
      // אם תאריך היעד הוא באותו חודש הנוכחי - כל הסכום נדרש "החודש" (חילוק ב-1, לא ב-0)
      const effectiveMonths = monthsRemaining === 0 ? 1 : monthsRemaining;
      requiredMonthly = remaining / effectiveMonths;
    }
  }

  // כמה חודשים ייקח להגיע ליעד בקצב ההפקדה החודשית הנוכחית שהוגדרה למטרה (ללא קשר לתאריך יעד)
  let paceMonths = null;
  if (goal.monthlyDeposit > 0) {
    paceMonths = Math.ceil(remaining / goal.monthlyDeposit);
  }

  // סטטוס: קודם בודקות אם יש בכלל תאריך יעד, אח"כ אם עבר, ואם לא - משוות בין הקצב הנדרש לנוכחי.
  // "צריך להגדיל מעט" (צהוב) מוגדר כטווח של עד 10% מתחת לקצב הנדרש - מעבר לזה זו חריגה גדולה (אדום).
  let statusKey;
  if (!goal.targetDate) {
    statusKey = "no-date";
  } else if (isOverdue) {
    statusKey = "red";
  } else if (goal.monthlyDeposit >= requiredMonthly) {
    statusKey = "green";
  } else if (goal.monthlyDeposit >= requiredMonthly * 0.9) {
    statusKey = "yellow";
  } else {
    statusKey = "red";
  }

  return {
    reached: false,
    remaining: remaining,
    monthsRemaining: monthsRemaining,
    isOverdue: isOverdue,
    requiredMonthly: requiredMonthly,
    paceMonths: paceMonths,
    statusKey: statusKey,
  };
}

// בונה את ה-HTML של אזור "🎯 האם אני בקצב?" בתוך כרטיס מטרה, לפי calculateGoalPace()
function buildGoalPaceSectionHtml(goal) {
  const pace = calculateGoalPace(goal);

  let inner = '<div class="goal-pace-title">🎯 האם אני בקצב?</div>';

  if (pace.reached) {
    inner += '<div class="goal-pace-line">🎉 היעד הזה כבר הושג - אין צורך בחישוב קצב.</div>';
    return '<div class="goal-pace-section">' + inner + "</div>";
  }

  inner += '<div class="goal-pace-line">נשאר לחסוך: ' + formatMoney(pace.remaining) + "</div>";

  if (pace.isOverdue) {
    inner += '<div class="goal-pace-line">⏰ תאריך היעד עבר - היעד באיחור</div>';
  } else if (pace.requiredMonthly !== null) {
    inner += '<div class="goal-pace-line">חודשים שנותרו עד תאריך היעד: ' + pace.monthsRemaining + "</div>";
    inner +=
      '<div class="goal-pace-line">נדרש לחסוך בחודש כדי להגיע בזמן: ' +
      formatMoney(Math.ceil(pace.requiredMonthly)) +
      "</div>";
  }

  if (pace.paceMonths !== null) {
    inner +=
      '<div class="goal-pace-line">בקצב הנוכחי (' +
      formatMoney(goal.monthlyDeposit) +
      " לחודש): תגיעי ליעד בעוד " +
      pace.paceMonths +
      " חודשים</div>";
  } else {
    inner += '<div class="goal-pace-line">אין מספיק מידע לחישוב קצב - לא הוגדרה הפקדה חודשית למטרה הזו</div>';
  }

  let statusClass, statusText;
  if (pace.statusKey === "no-date") {
    statusClass = "pace-neutral";
    statusText = "אין תאריך יעד — אפשר לחשב לפי קצב החיסכון";
  } else if (pace.statusKey === "green") {
    statusClass = "pace-good";
    statusText = "🟢 את בקצב להגיע ליעד";
  } else if (pace.statusKey === "yellow") {
    statusClass = "pace-caution";
    statusText = "🟡 צריך להגדיל מעט את החיסכון החודשי";
  } else {
    statusClass = "pace-warning";
    statusText = "🔴 בקצב הנוכחי לא תגיעי ליעד בזמן";
  }

  inner += '<div class="month-pace-line ' + statusClass + '">' + statusText + "</div>";

  return '<div class="goal-pace-section">' + inner + "</div>";
}

// מחשבת סימולציה נפרדת ("מה יקרה אם אחסוך X בחודש") - חישוב בלבד, לא נוגעת ב-goal האמיתי
// ולא כותבת כלום ל-budgetData. משתמשת ב-goal.target/saved/targetDate הקיימים בלבד.
function calculateGoalSimulation(goal, monthlyAmount) {
  const remaining = Math.max(0, goal.target - goal.saved);

  if (remaining <= 0) {
    return { alreadyReached: true };
  }
  if (!monthlyAmount || monthlyAmount <= 0) {
    return { invalid: true };
  }

  const monthsToGoal = Math.ceil(remaining / monthlyAmount);
  const now = new Date();
  const arrivalDate = new Date(now.getFullYear(), now.getMonth() + monthsToGoal, 1);

  let comparison = null;
  if (goal.targetDate) {
    const target = parseDateInputValue(goal.targetDate);
    const arrivalIndex = arrivalDate.getFullYear() * 12 + arrivalDate.getMonth();
    const targetIndex = target.getFullYear() * 12 + target.getMonth();
    comparison = { diffMonths: targetIndex - arrivalIndex }; // חיובי = מגיעים לפני תאריך היעד
  }

  return { monthsToGoal: monthsToGoal, arrivalDate: arrivalDate, comparison: comparison };
}

// מריצה את הסימולציה עבור מטרה מסוימת ומציגה את התוצאה בתוך אזור התוצאה של הכרטיס שלה
function runGoalSimulation(goalId, monthlyAmount, cardEl) {
  const resultDiv = cardEl.querySelector(".goal-sim-result");
  const goal = budgetData.savingsGoals.find((g) => g.id === goalId);
  if (!goal || !resultDiv) {
    return;
  }

  const sim = calculateGoalSimulation(goal, monthlyAmount);

  if (sim.invalid) {
    resultDiv.textContent = "נא להזין סכום חיסכון חודשי גדול מ-0";
    return;
  }
  if (sim.alreadyReached) {
    resultDiv.textContent = "🎉 היעד הזה כבר הושג!";
    return;
  }

  let text =
    "אם תחסכי " +
    formatMoney(monthlyAmount) +
    " בחודש, תגיעי ליעד בעוד " +
    sim.monthsToGoal +
    " חודשים · 📅 " +
    monthNames[sim.arrivalDate.getMonth()] +
    " " +
    sim.arrivalDate.getFullYear();

  if (sim.comparison) {
    const diff = sim.comparison.diffMonths;
    if (diff > 0) {
      text += " · 🟢 " + diff + " חודשים לפני תאריך היעד";
    } else if (diff < 0) {
      text += " · 🔴 " + Math.abs(diff) + " חודשים אחרי תאריך היעד";
    } else {
      text += " · 🟢 מדויק בתאריך היעד";
    }
  }

  resultDiv.textContent = text;
}

// בונה מחדש את טבלת ההיסטוריה - שורה לכל חודש שנסגר, החודש האחרון שנסגר למעלה
function renderHistoryTable() {
  const tableBody = document.getElementById("history-table-body");
  tableBody.innerHTML = "";

  // .slice() יוצר עותק של הרשימה, ו-.reverse() הופך את הסדר - כך שהאחרון שנוסף מוצג ראשון
  const historyNewestFirst = budgetData.history.slice().reverse();

  historyNewestFirst.forEach((month) => {
    const row = document.createElement("tr");
    row.innerHTML =
      "<td>" + month.month + "</td>" +
      "<td>" + formatMoney(month.income) + "</td>" +
      "<td>" + formatMoney(month.expenses) + "</td>" +
      "<td>" + formatMoney(month.savings) + "</td>" +
      "<td>" + formatMoney(month.remaining) + "</td>" +
      '<td><button class="history-delete" data-id="' + month.id + '" aria-label="מחק רשומה">🗑️</button></td>';
    tableBody.appendChild(row);
  });
}

// מאזין לחיצה אחד על כל טבלת ההיסטוריה, כדי לתפוס לחיצות על כפתורי המחיקה
// (בדיוק כמו שעשינו ברשימת המטרות - מאזין אחד, לא אחד לכל כפתור)
document.getElementById("history-table-body").addEventListener("click", function (event) {
  if (!event.target.classList.contains("history-delete")) {
    return;
  }

  const confirmed = confirm("למחוק את השורה הזו מההיסטוריה? אי אפשר לשחזר את זה.");
  if (!confirmed) {
    return;
  }

  const idToDelete = Number(event.target.getAttribute("data-id"));
  budgetData.history = budgetData.history.filter((entry) => entry.id !== idToDelete);

  saveData();
  renderHistoryTable();
});

// כשלוחצים "סגור את החודש ושמור בהיסטוריה":
document.getElementById("close-month-button").addEventListener("click", function () {
  const confirmed = confirm(
    "לסגור את " + getCurrentMonthLabel() + " ולהתחיל חודש חדש?\n" +
    "הנתונים הנוכחיים יישמרו בהיסטוריה, ושדות ההכנסה וההוצאות יתאפסו."
  );
  if (!confirmed) {
    return;
  }

  const totalIncome = calculateTotalIncome();
  const expenses = calculateExpensesBreakdown();
  const totalSavings = calculateTotalSavings();
  const remaining = totalIncome - expenses.total - totalSavings;

  budgetData.history.push({
    id: Date.now(),
    month: getCurrentMonthLabel(),
    income: totalIncome,
    expenses: expenses.total,
    savings: totalSavings,
    remaining: remaining,
  });

  // מאפסות רק הכנסה והוצאות בפועל, כי אלה משתנות כל חודש.
  // תקציבים ומטרות חיסכון נשארים כמו שהם - הם בדרך כלל דומים מחודש לחודש.
  // מקורות ההכנסה עצמם (מי מרוויח) גם נשארים - בדרך כלל אותם אנשים/מקורות מחודש לחודש -
  // רק הסכום של כל מקור מתאפס, בדיוק כמו שקורה לכל קטגוריית הוצאה.
  budgetData.income.sources.forEach((source) => {
    source.amount = 0;
  });
  fixedFields.forEach((field) => {
    budgetData.expensesFixed[field.key] = 0;
  });
  variableFields.forEach((field) => {
    budgetData.expensesVariable[field.key] = 0;
  });
  // הוצאות מהירות עצמן נשארות (בדיוק כמו מקורות הכנסה/קטגוריות) - רק מונה השימוש החודשי שלהן מתאפס
  budgetData.quickExpenses.forEach((qe) => {
    qe.usageCount = 0;
    qe.usageTotal = 0;
  });

  saveData();

  // מרעננות את השדות בטפסים כדי שיציגו 0, ולא את המספרים הישנים
  renderIncomeSources();
  renderQuickExpenses();
  fixedFields.forEach((field) => {
    document.getElementById(field.id).value = 0;
  });
  variableFields.forEach((field) => {
    document.getElementById(field.id).value = 0;
  });

  renderHistoryTable();
  renderDashboard();
});

// מאזין לחיצה אחד על כל רשימת המטרות (ולא מאזין נפרד לכל כפתור מחיקה) -
// כך זה עובד גם על כרטיסים שנוצרו רק הרגע. אנחנו בודקים אם באמת לחצו על כפתור המחיקה.
document.getElementById("goals-list").addEventListener("click", function (event) {
  const deleteButton = event.target.closest(".goal-delete");
  if (deleteButton) {
    const idToDelete = Number(deleteButton.getAttribute("data-id"));
    budgetData.savingsGoals = budgetData.savingsGoals.filter((goal) => goal.id !== idToDelete);

    saveData();
    renderSavingsGoals();
    renderDashboard(); // כי סכום החיסכון הכולל השתנה
    return;
  }

  // מכאן והלאה - כפתורי הסימולציה (שלב 16). הם לא שומרים ולא משנים כלום ב-budgetData,
  // רק מציגים חישוב בתוך אזור התוצאה של הכרטיס.
  const simToggleButton = event.target.closest(".goal-sim-toggle-button");
  if (simToggleButton) {
    const revealDiv = simToggleButton.closest(".goal-card").querySelector(".goal-sim-reveal");
    revealDiv.style.display = revealDiv.style.display === "none" ? "block" : "none";
    return;
  }

  const presetButton = event.target.closest(".goal-sim-amount-button");
  if (presetButton) {
    const goalId = Number(presetButton.getAttribute("data-id"));
    const amount = Number(presetButton.getAttribute("data-amount"));
    runGoalSimulation(goalId, amount, presetButton.closest(".goal-card"));
    return;
  }

  const customButton = event.target.closest(".goal-sim-custom-button");
  if (customButton) {
    const card = customButton.closest(".goal-card");
    const goalId = Number(customButton.getAttribute("data-id"));
    const amount = Number(card.querySelector(".goal-sim-custom-input").value) || 0;
    runGoalSimulation(goalId, amount, card);
    return;
  }
});

// כשלוחצים "הוסף מטרה":
document.getElementById("goal-form").addEventListener("submit", function (event) {
  event.preventDefault(); // מונע רפרש של הדף

  const name = document.getElementById("goal-name").value.trim();
  if (!name) {
    alert("צריך לתת שם למטרה");
    return;
  }

  const target = parseNonNegativeAmount(document.getElementById("goal-target").value);
  const saved = parseNonNegativeAmount(document.getElementById("goal-saved").value);
  const monthlyDeposit = parseNonNegativeAmount(document.getElementById("goal-monthly").value);

  if (target === null || saved === null || monthlyDeposit === null) {
    alert(NEGATIVE_AMOUNT_MESSAGE);
    return;
  }

  const newGoal = {
    id: Date.now(), // מספר שמשתנה כל מילישנייה - מתאים כ"תעודת זהות" ייחודית למטרה
    name: name,
    target: target,
    saved: saved,
    monthlyDeposit: monthlyDeposit,
    // תאריך יעד - שדה חדש (שלב 16), אופציונלי. אם לא הוזן - שומרות null ולא תאריך מומצא.
    // "YYYY-MM-DD" כמו שמגיע מ-input type="date", או null.
    targetDate: document.getElementById("goal-target-date").value || null,
  };

  budgetData.savingsGoals.push(newGoal);
  saveData();

  event.target.reset(); // מנקה את הטופס, מוכן למטרה הבאה
  renderSavingsGoals();
  renderDashboard(); // כי סכום החיסכון הכולל השתנה
});

// ממלאת את כל שדות הטפסים (הוצאות, תקציבים) לפי מה שיש כרגע ב-budgetData.
// זה קוד שהיה פעם כתוב ישירות כאן (רק בטעינת הדף), והוצאתי אותו לפונקציה נפרדת
// כדי שנוכל להריץ אותו שוב גם אחרי ייבוא גיבוי - ההתנהגות שלו לא השתנתה.
// (הכנסה כבר לא טופס עם שדות קבועים - מקורות ההכנסה מוצגים ע"י renderIncomeSources())
function fillAllInputs() {
  fixedFields.forEach((field) => {
    document.getElementById(field.id).value = budgetData.expensesFixed[field.key];
  });
  variableFields.forEach((field) => {
    document.getElementById(field.id).value = budgetData.expensesVariable[field.key];
  });

  variableFields.forEach((field) => {
    document.getElementById("budget-" + field.key).value = budgetData.budgets[field.key];
  });
}

// מציגה בטפסים את הערכים ההתחלתיים
fillAllInputs();

// ===== ולידציה עמוקה של קובץ שיובא (Import) =====
// המטרה: לוודא שאין שום דרך שקובץ פגום/חלקי יוביל ל-"₪NaN" בדשבורד, ולעולם לא לדרוס
// את הנתונים הקיימים לפני שווידאנו שהקובץ החדש תקין לגמרי. הכללים:
// - מפתח כספי שחסר לגמרי בתוך אובייקט קיים (למשל expensesFixed בלי "arnona") - תיקון בטוח,
//   ממלאות אותו ב-0 (בדיוק ברוח ensureBackwardCompatibleFields הקיימת, ברמת שדה בודד).
// - ערך שקיים אבל לא מספר תקין/לא-שלילי, או תאריך שלא קיים בלוח השנה - לא ניתן לתיקון בטוח,
//   ודוחות את כל הקובץ (עדיף לדחות עם הודעה ברורה מאשר לנחש).

// בודקת שערך הוא מספר תקין (לא NaN/Infinity) ולא שלילי - כל שדה כספי בייבוא עובר את הבדיקה הזו
function isValidNonNegativeNumber(value) {
  return typeof value === "number" && isFinite(value) && value >= 0;
}

// בודקת ששילוב שנה/חודש (0=ינואר, כמו getMonth())/יום מתאר יום שבאמת קיים בלוח השנה
function isValidCalendarDayForMonth(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  if (month < 0 || month > 11 || day < 1 || day > 31) {
    return false;
  }
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return day <= daysInMonth;
}

// בודקת שמחרוזת בפורמט "YYYY-MM-DD" (כמו מ-input type="date") מתארת תאריך אמיתי -
// כדי שתאריך כמו "2026-02-30" (30 בפברואר, לא קיים) לא יעבור בשקט ויגלוש לחודש אחר
function isValidCalendarDateString(dateString) {
  if (typeof dateString !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }
  const parts = dateString.split("-");
  return isValidCalendarDayForMonth(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

// בודקת אובייקט כספי מיובא (income/expensesFixed/expensesVariable/budgets) מול רשימת המפתחות הצפויה.
// מפתח חסר -> ברירת מחדל 0 (תיקון בטוח). מפתח קיים עם ערך לא תקין -> ok: false (דוחות את כל הקובץ).
function sanitizeImportedMoneyFields(obj, fieldKeys) {
  if (!obj || typeof obj !== "object") {
    return { ok: false };
  }
  const value = {};
  for (const key of fieldKeys) {
    if (!(key in obj)) {
      value[key] = 0;
      continue;
    }
    if (!isValidNonNegativeNumber(obj[key])) {
      return { ok: false };
    }
    value[key] = obj[key];
  }
  return { ok: true, value: value };
}

// בודקת ומנקה את רשימת מטרות החיסכון המיובאת - שם, שלושת השדות הכספיים, ותאריך יעד תקין (אם קיים)
function sanitizeImportedSavingsGoals(goals) {
  if (!Array.isArray(goals)) {
    return { ok: false };
  }
  const sanitized = [];
  for (const goal of goals) {
    if (!goal || typeof goal !== "object" || typeof goal.name !== "string") {
      return { ok: false };
    }
    const money = sanitizeImportedMoneyFields(goal, ["target", "saved", "monthlyDeposit"]);
    if (!money.ok) {
      return { ok: false };
    }
    let targetDate = null;
    if (goal.targetDate !== null && goal.targetDate !== undefined) {
      if (!isValidCalendarDateString(goal.targetDate)) {
        return { ok: false };
      }
      targetDate = goal.targetDate;
    }
    sanitized.push({
      id: typeof goal.id === "number" ? goal.id : Date.now() + sanitized.length,
      name: goal.name,
      target: money.value.target,
      saved: money.value.saved,
      monthlyDeposit: money.value.monthlyDeposit,
      targetDate: targetDate,
    });
  }
  return { ok: true, value: sanitized };
}

// בודקת ומנקה את היסטוריית החודשים המיובאת. שימו לב: "remaining" הוא ערך מחושב שיכול להיות
// שלילי בלגיטימיות (חודש עם חריגה מהתקציב) - בודקות רק שהוא מספר תקין, בלי הגבלת סימן.
function sanitizeImportedHistory(history) {
  if (!Array.isArray(history)) {
    return { ok: false };
  }
  const sanitized = [];
  for (const entry of history) {
    if (!entry || typeof entry !== "object" || typeof entry.month !== "string") {
      return { ok: false };
    }
    if (
      !isValidNonNegativeNumber(entry.income) ||
      !isValidNonNegativeNumber(entry.expenses) ||
      !isValidNonNegativeNumber(entry.savings)
    ) {
      return { ok: false };
    }
    if (typeof entry.remaining !== "number" || !isFinite(entry.remaining)) {
      return { ok: false };
    }
    sanitized.push({
      id: typeof entry.id === "number" ? entry.id : Date.now() + sanitized.length,
      month: entry.month,
      income: entry.income,
      expenses: entry.expenses,
      savings: entry.savings,
      remaining: entry.remaining,
    });
  }
  return { ok: true, value: sanitized };
}

// בודקת ומנקה את מקורות ההכנסה המיובאים (income.sources) - שם לא ריק, וסכום לא-שלילי לכל מקור
function sanitizeImportedIncomeSources(sources) {
  if (!Array.isArray(sources)) {
    return { ok: false };
  }
  const sanitized = [];
  for (const source of sources) {
    if (!source || typeof source !== "object" || typeof source.name !== "string" || !source.name.trim()) {
      return { ok: false };
    }
    if (!isValidNonNegativeNumber(source.amount)) {
      return { ok: false };
    }
    sanitized.push({
      id: typeof source.id === "number" ? source.id : Date.now() + sanitized.length,
      name: source.name,
      amount: source.amount,
    });
  }
  return { ok: true, value: sanitized };
}

// בודקת ומנקה את income המיובא - תומכת גם בפורמט הנוכחי (income.sources) וגם בפורמט הישן
// (income.salary/income.other), כדי שגיבויים מלפני שדרוג מקורות ההכנסה ימשיכו לעבוד בייבוא.
function sanitizeImportedIncome(income) {
  if (!income || typeof income !== "object") {
    return { ok: false };
  }
  if (Array.isArray(income.sources)) {
    return sanitizeImportedIncomeSources(income.sources);
  }
  // פורמט ישן - מוודאות ששני השדות תקינים, ואז ממירות למקורות באותה לוגיקה בדיוק כמו בטעינה רגילה
  const legacyMoney = sanitizeImportedMoneyFields(income, ["salary", "other"]);
  if (!legacyMoney.ok) {
    return { ok: false };
  }
  return { ok: true, value: migrateLegacyIncomeToSources(legacyMoney.value) };
}

// בודקת ומנקה את אירועי לוח השנה המיובאים - סוג אירוע מוכר (מתוך eventTypes הקיימת), סכום
// לא-שלילי, ויום/חודש/שנה שמתארים תאריך אמיתי (לאירוע חד-פעמי; לאירוע חוזר מספיק יום 1-31 תקין,
// בדיוק לפי אותה לוגיקה שכבר קיימת ב-collectEventsForDay/collectEventsForMonth)
function sanitizeImportedCalendarEvents(events) {
  if (!Array.isArray(events)) {
    return { ok: false };
  }
  const validTypeKeys = eventTypes.map((t) => t.key);
  const sanitized = [];
  for (const ev of events) {
    if (!ev || typeof ev !== "object") {
      return { ok: false };
    }
    if (!validTypeKeys.includes(ev.type)) {
      return { ok: false };
    }
    if (typeof ev.name !== "string" || !ev.name.trim()) {
      return { ok: false };
    }
    if (!isValidNonNegativeNumber(ev.amount)) {
      return { ok: false };
    }
    const recurring = !!ev.recurring;
    if (!Number.isInteger(ev.day) || ev.day < 1 || ev.day > 31) {
      return { ok: false };
    }
    if (!Number.isInteger(ev.year) || !Number.isInteger(ev.month) || ev.month < 0 || ev.month > 11) {
      return { ok: false };
    }
    if (!recurring && !isValidCalendarDayForMonth(ev.year, ev.month, ev.day)) {
      return { ok: false };
    }
    sanitized.push({
      id: typeof ev.id === "number" ? ev.id : Date.now() + sanitized.length,
      type: ev.type,
      name: ev.name,
      amount: ev.amount,
      day: ev.day,
      recurring: recurring,
      year: ev.year,
      month: ev.month,
    });
  }
  return { ok: true, value: sanitized };
}

// בודקת ומנקה את ההוצאות המהירות המיובאות - שם לא ריק, סכום לא-שלילי, type תקין ("fixed"/
// "variable"), category שקיימת בפועל ברשימת fixedFields/variableFields המתאימה, ו-id מספרי
// וייחודי לכל הוצאה מהירה (בניגוד לשאר הרשימות המיובאות באפליקציה, כאן דוחות את כל הקובץ
// אם ה-id חסר/לא מספר/כפול, ולא ממציאות id חדש - זה מה שהתבקש עבור הפיצ'ר הזה במפורש).
function sanitizeImportedQuickExpenses(quickExpenses) {
  if (!Array.isArray(quickExpenses)) {
    return { ok: false };
  }
  const seenIds = new Set();
  const sanitized = [];
  for (const qe of quickExpenses) {
    if (!qe || typeof qe !== "object" || typeof qe.name !== "string" || !qe.name.trim()) {
      return { ok: false };
    }
    if (!isValidNonNegativeNumber(qe.amount)) {
      return { ok: false };
    }
    if (qe.type !== "fixed" && qe.type !== "variable") {
      return { ok: false };
    }
    const validKeys = (qe.type === "fixed" ? fixedFields : variableFields).map((f) => f.key);
    if (!validKeys.includes(qe.category)) {
      return { ok: false };
    }
    if (typeof qe.id !== "number" || !isFinite(qe.id) || seenIds.has(qe.id)) {
      return { ok: false };
    }
    seenIds.add(qe.id);

    // usageCount/usageTotal הם מונה תצוגה שנוסף אחרי - גיבוי ישן בלעדיהם ממשיך לעבוד (ברירת מחדל 0),
    // אבל אם הם כן קיימים בקובץ הם חייבים להיות מספרים תקינים ולא-שליליים כמו כל שדה כספי אחר.
    let usageCount = 0;
    if (qe.usageCount !== undefined) {
      if (!isValidNonNegativeNumber(qe.usageCount)) {
        return { ok: false };
      }
      usageCount = qe.usageCount;
    }
    let usageTotal = 0;
    if (qe.usageTotal !== undefined) {
      if (!isValidNonNegativeNumber(qe.usageTotal)) {
        return { ok: false };
      }
      usageTotal = qe.usageTotal;
    }

    sanitized.push({
      id: qe.id,
      name: qe.name,
      amount: qe.amount,
      type: qe.type,
      category: qe.category,
      usageCount: usageCount,
      usageTotal: usageTotal,
    });
  }
  return { ok: true, value: sanitized };
}

// הפונקציה הראשית: בודקת קובץ שיובא לעומק, ומחזירה גרסה נקייה ובטוחה שלו אם הוא תקין.
// { ok: true, value: <budgetData נקי> } או { ok: false } אם הקובץ פגום באופן שלא ניתן לתקן בבטחה.
function sanitizeImportedBudgetData(data) {
  if (!data || typeof data !== "object") {
    return { ok: false };
  }

  const income = sanitizeImportedIncome(data.income);
  if (!income.ok) {
    return { ok: false };
  }

  if (!data.expensesFixed || typeof data.expensesFixed !== "object") {
    return { ok: false };
  }
  const expensesFixed = sanitizeImportedMoneyFields(data.expensesFixed, fixedFields.map((f) => f.key));
  if (!expensesFixed.ok) {
    return { ok: false };
  }

  if (!data.expensesVariable || typeof data.expensesVariable !== "object") {
    return { ok: false };
  }
  const expensesVariable = sanitizeImportedMoneyFields(data.expensesVariable, variableFields.map((f) => f.key));
  if (!expensesVariable.ok) {
    return { ok: false };
  }

  if (!data.budgets || typeof data.budgets !== "object") {
    return { ok: false };
  }
  const budgets = sanitizeImportedMoneyFields(data.budgets, variableFields.map((f) => f.key));
  if (!budgets.ok) {
    return { ok: false };
  }

  const savingsGoals = sanitizeImportedSavingsGoals(data.savingsGoals);
  if (!savingsGoals.ok) {
    return { ok: false };
  }

  const history = sanitizeImportedHistory(data.history);
  if (!history.ok) {
    return { ok: false };
  }

  // calendarEvents ו-currentBalance נוספו לאפליקציה אחרי savingsGoals/history - גיבוי ישן לגיטימי
  // עשוי שלא לכלול אותם בכלל (בדיוק כמו ש-ensureBackwardCompatibleFields כבר מטפלת בזה).
  // אם הם כן קיימים בקובץ - הם חייבים להיות תקינים.
  let calendarEvents = { ok: true, value: [] };
  if (data.calendarEvents !== undefined) {
    calendarEvents = sanitizeImportedCalendarEvents(data.calendarEvents);
    if (!calendarEvents.ok) {
      return { ok: false };
    }
  }

  let currentBalance = 0;
  if (data.currentBalance !== undefined) {
    if (!isValidNonNegativeNumber(data.currentBalance)) {
      return { ok: false };
    }
    currentBalance = data.currentBalance;
  }

  // quickExpenses נוסף לאפליקציה מאוחר יותר - גיבוי ישן לגיטימי עשוי שלא לכלול אותו בכלל
  let quickExpenses = { ok: true, value: [] };
  if (data.quickExpenses !== undefined) {
    quickExpenses = sanitizeImportedQuickExpenses(data.quickExpenses);
    if (!quickExpenses.ok) {
      return { ok: false };
    }
  }

  return {
    ok: true,
    value: {
      income: { sources: income.value },
      expensesFixed: expensesFixed.value,
      expensesVariable: expensesVariable.value,
      budgets: budgets.value,
      savingsGoals: savingsGoals.value,
      history: history.value,
      calendarEvents: calendarEvents.value,
      currentBalance: currentBalance,
      quickExpenses: quickExpenses.value,
    },
  };
}

// כשלוחצים "⬇️ ייצוא נתונים": יוצרת קובץ JSON מכל budgetData, ומורידה אותו למחשב
document.getElementById("export-button").addEventListener("click", function () {
  const jsonText = JSON.stringify(budgetData, null, 2);

  // Blob הוא "קובץ בזיכרון" - כאן אנחנו יוצרות אחד מהטקסט של ה-JSON
  const blob = new Blob([jsonText], { type: "application/json" });
  const downloadUrl = URL.createObjectURL(blob);

  // שם הקובץ יכלול את החודש והשנה הנוכחיים, למשל budget-backup-2026-09.json
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const filename = "budget-backup-" + yyyy + "-" + mm + ".json";

  // הדרך המקובלת "להוריד" קובץ מ-JavaScript: יוצרים קישור <a> זמני ולוחצים עליו בעצמנו
  const tempLink = document.createElement("a");
  tempLink.href = downloadUrl;
  tempLink.download = filename;
  document.body.appendChild(tempLink);
  tempLink.click();
  document.body.removeChild(tempLink);

  URL.revokeObjectURL(downloadUrl); // משחררת את הזיכרון שהדפדפן הקצה לקובץ הזמני
});

// כשלוחצים "⬆️ ייבוא נתונים": פותחת את חלון בחירת הקובץ המוסתר
document.getElementById("import-button").addEventListener("click", function () {
  document.getElementById("import-file-input").click();
});

// כשבוחרים קובץ בפועל בחלון שנפתח:
document.getElementById("import-file-input").addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader(); // כלי שיודע לקרוא את תוכן הקובץ שנבחר

  reader.onload = function () {
    let parsedData;
    try {
      parsedData = JSON.parse(reader.result);
    } catch (error) {
      alert("הקובץ שנבחר אינו קובץ JSON תקין.");
      event.target.value = ""; // מאפסות כדי שאפשר לנסות לבחור קובץ מחדש
      return;
    }

    const sanitized = sanitizeImportedBudgetData(parsedData);
    if (!sanitized.ok) {
      alert(
        "הקובץ אינו תקין - חסרים בו שדות, יש בו ערכים לא תקינים או שליליים, או תאריך שלא קיים בלוח השנה. " +
        "ודאי שזה קובץ גיבוי שיוצא מהאפליקציה הזו. הנתונים הקיימים שלך לא נפגעו."
      );
      event.target.value = "";
      return;
    }

    const confirmed = confirm("ייבוא גיבוי יחליף את הנתונים הקיימים. להמשיך?");
    if (!confirmed) {
      event.target.value = "";
      return;
    }

    budgetData = sanitized.value;
    ensureBackwardCompatibleFields(); // ליתר ביטחון, כמו בכל טעינת נתונים אחרת
    saveData();

    // מרעננות את כל התצוגה - הטפסים, הדשבורד, מקורות ההכנסה, הוצאות מהירות, המטרות, ההיסטוריה, לוח השנה והיתרה - עם הנתונים שיובאו
    fillAllInputs();
    renderIncomeSources();
    renderQuickExpenses();
    renderSavingsGoals();
    renderHistoryTable();
    renderDashboard();
    renderBalanceCard();
    renderCalendar(); // renderCalendar קוראת גם ל-renderCashFlowSection, ל-renderNextSalarySection ול-renderBalanceForecastSection

    alert("הנתונים יובאו בהצלחה!");
    event.target.value = "";
  };

  reader.readAsText(file);
});

// ===== מקורות הכנסה =====
// רשימה חופשית באורך כלשהו (budgetData.income.sources), בדיוק כמו savingsGoals/calendarEvents -
// כל מקור הוא { id, name, amount }. אותו דפוס add/edit/delete-with-modal כמו אירועי לוח השנה.

// בונה מחדש את רשימת מקורות ההכנסה ואת "סה"כ הכנסות", לפי budgetData.income.sources.
// לא מחשבת סכום בעצמה - קוראת ל-calculateTotalIncome() הקיימת, כדי שיהיה מקור אמת יחיד.
function renderIncomeSources() {
  const container = document.getElementById("income-sources-list");
  container.innerHTML = "";

  budgetData.income.sources.forEach((source) => {
    const card = document.createElement("div");
    card.className = "goal-card";
    card.innerHTML =
      '<div class="goal-header">' +
      '<span class="goal-name">' + source.name + "</span>" +
      '<span class="income-source-actions">' +
      '<button type="button" class="income-source-edit" data-id="' + source.id + '" aria-label="ערוך מקור הכנסה">✏️</button>' +
      '<button type="button" class="goal-delete" data-id="' + source.id + '" aria-label="מחק מקור הכנסה">🗑️</button>' +
      "</span>" +
      "</div>" +
      '<div class="income-source-amount">' + formatMoney(source.amount) + "</div>";
    container.appendChild(card);
  });

  document.getElementById("income-sources-total-value").textContent = formatMoney(calculateTotalIncome());
}

// כשעורכים מקור קיים, שומרת כאן את ה-id שלו. null = מוסיפות מקור חדש (בדיוק כמו editingEventId)
let editingIncomeSourceId = null;

function openAddIncomeSourceModal() {
  editingIncomeSourceId = null;

  document.getElementById("income-source-modal-title").textContent = "הוספת מקור הכנסה";
  document.getElementById("income-source-name-input").value = "";
  document.getElementById("income-source-amount-input").value = "";
  document.getElementById("income-source-delete-button").style.display = "none";

  document.getElementById("income-source-modal-overlay").style.display = "flex";
}

function openEditIncomeSourceModal(sourceId) {
  const source = budgetData.income.sources.find((s) => s.id === sourceId);
  if (!source) {
    return;
  }

  editingIncomeSourceId = sourceId;

  document.getElementById("income-source-modal-title").textContent = "עריכת מקור הכנסה";
  document.getElementById("income-source-name-input").value = source.name;
  document.getElementById("income-source-amount-input").value = source.amount;
  document.getElementById("income-source-delete-button").style.display = "inline-block";

  document.getElementById("income-source-modal-overlay").style.display = "flex";
}

function closeIncomeSourceModal() {
  document.getElementById("income-source-modal-overlay").style.display = "none";
  editingIncomeSourceId = null;
}

document.getElementById("add-income-source-button").addEventListener("click", openAddIncomeSourceModal);
document.getElementById("income-source-cancel-button").addEventListener("click", closeIncomeSourceModal);

// לחיצה על הרקע הכהה מסביב לחלון (ולא על החלון עצמו) סוגרת את המודאל
document.getElementById("income-source-modal-overlay").addEventListener("click", function (event) {
  if (event.target.id === "income-source-modal-overlay") {
    closeIncomeSourceModal();
  }
});

// מאזין לחיצה אחד על כל רשימת מקורות ההכנסה - תופס גם עריכה וגם מחיקה מהירה, בלי מאזין נפרד לכל כפתור
document.getElementById("income-sources-list").addEventListener("click", function (event) {
  const editButton = event.target.closest(".income-source-edit");
  if (editButton) {
    openEditIncomeSourceModal(Number(editButton.getAttribute("data-id")));
    return;
  }

  const deleteButton = event.target.closest(".goal-delete");
  if (deleteButton) {
    const confirmed = confirm("למחוק את מקור ההכנסה הזה? אי אפשר לשחזר את זה.");
    if (!confirmed) {
      return;
    }
    const idToDelete = Number(deleteButton.getAttribute("data-id"));
    budgetData.income.sources = budgetData.income.sources.filter((s) => s.id !== idToDelete);
    saveData();
    renderIncomeSources();
    renderDashboard();
  }
});

// כשלוחצים "שמור" בטופס מקור ההכנסה (גם בהוספה וגם בעריכה):
document.getElementById("income-source-form").addEventListener("submit", function (event) {
  event.preventDefault();

  const name = document.getElementById("income-source-name-input").value.trim();
  if (!name) {
    alert("צריך לתת שם למקור ההכנסה");
    return;
  }

  const amount = parseNonNegativeAmount(document.getElementById("income-source-amount-input").value);
  if (amount === null) {
    alert(NEGATIVE_AMOUNT_MESSAGE);
    return;
  }

  if (editingIncomeSourceId === null) {
    budgetData.income.sources.push({ id: Date.now(), name: name, amount: amount });
  } else {
    const source = budgetData.income.sources.find((s) => s.id === editingIncomeSourceId);
    if (source) {
      source.name = name;
      source.amount = amount;
    }
  }

  saveData();
  closeIncomeSourceModal();
  renderIncomeSources();
  renderDashboard();
});

// כשלוחצים "מחק מקור" (מוצג רק במצב עריכה):
document.getElementById("income-source-delete-button").addEventListener("click", function () {
  const confirmed = confirm("למחוק את מקור ההכנסה הזה? אי אפשר לשחזר את זה.");
  if (!confirmed) {
    return;
  }

  budgetData.income.sources = budgetData.income.sources.filter((s) => s.id !== editingIncomeSourceId);
  saveData();
  closeIncomeSourceModal();
  renderIncomeSources();
  renderDashboard();
});

// ===== הוצאות מהירות =====
// קיצורי דרך אישיים ({ id, name, amount, type, category }) שמוסיפים הוצאה רגילה בלחיצה אחת.
// חשוב: זו לא מערכת הוצאות מקבילה - "type"+"category" מצביעים על קטגוריה קיימת ממש
// ב-fixedFields/variableFields, ולחיצה על "+" רק מוסיפה את amount לקטגוריה הזו
// ב-budgetData.expensesFixed/expensesVariable (ר' applyQuickExpense), בדיוק כאילו הוקלד
// ידנית בטופס "עדכון הוצאות חודשיות" ונשמר. לכן זה מופיע אוטומטית בכל מקום שכבר קורא
// מהשדות האלה (Dashboard, breakdown, גרפים, תקציבים, סיכום חודשי, היסטוריה בסגירת חודש).

// ממלאת את select הקטגוריה במודאל מתוך fixedFields/variableFields הקיימות - אין כאן
// רשימת קטגוריות חדשה, רק שימוש ברשימה הקיימת. נקראת פעם אחת בטעינת הדף.
function populateQuickExpenseCategoryOptions() {
  const select = document.getElementById("quick-expense-category-input");
  let html = '<optgroup label="הוצאות קבועות">';
  fixedFields.forEach((field) => {
    html += '<option value="fixed:' + field.key + '">' + field.icon + " " + field.label + "</option>";
  });
  html += '</optgroup><optgroup label="הוצאות משתנות">';
  variableFields.forEach((field) => {
    html += '<option value="variable:' + field.key + '">' + field.icon + " " + field.label + "</option>";
  });
  html += "</optgroup>";
  select.innerHTML = html;
}

// מחזירה את התווית העברית של קטגוריה, לפי type+category - קריאה בלבד מ-fixedFields/variableFields
function getQuickExpenseCategoryLabel(type, category) {
  const list = type === "fixed" ? fixedFields : variableFields;
  const field = list.find((f) => f.key === category);
  return field ? field.icon + " " + field.label : category;
}

// בונה מחדש את רשימת ההוצאות המהירות, לפי budgetData.quickExpenses
function renderQuickExpenses() {
  const container = document.getElementById("quick-expenses-list");
  container.innerHTML = "";

  budgetData.quickExpenses.forEach((qe) => {
    const card = document.createElement("div");
    card.className = "goal-card";
    card.innerHTML =
      '<div class="goal-header">' +
      '<span class="goal-name">' + qe.name + "</span>" +
      '<span class="quick-expense-actions">' +
      '<button type="button" class="quick-expense-add-button" data-id="' + qe.id + '" aria-label="הוסף הוצאה: ' + qe.name + '">+</button>' +
      '<button type="button" class="income-source-edit" data-id="' + qe.id + '" aria-label="ערוך הוצאה מהירה">✏️</button>' +
      '<button type="button" class="goal-delete" data-id="' + qe.id + '" aria-label="מחק הוצאה מהירה">🗑️</button>' +
      "</span>" +
      "</div>" +
      '<div class="quick-expense-details">' +
      '<span class="quick-expense-amount">' + formatMoney(qe.amount) + "</span> · " +
      getQuickExpenseCategoryLabel(qe.type, qe.category) +
      "</div>" +
      '<div class="quick-expense-usage">' +
      "נוסף " + qe.usageCount + " פעמים · סה\"כ " + formatMoney(qe.usageTotal) +
      "</div>";
    container.appendChild(card);
  });
}

// כשלוחצים "+" על הוצאה מהירה: מוסיפה את הסכום שלה לקטגוריה המתאימה ב-expensesFixed/
// expensesVariable הקיימים (בדיוק כמו עדכון ידני של הטופס), עם תאריך "עכשיו" באופן טבעי -
// כי אלה שדות "החודש הנוכחי" בלבד, בלי שדה תאריך נפרד (בהתאם למבנה הקיים של האפליקציה).
// לא נוגעת ב-quickExpenses עצמה מעבר למונים - עריכה עתידית של הקיצור לא משנה הוצאות שכבר נוצרו כך.
//
// usageCount/usageTotal הם מונה תצוגה בלבד ("נוסף X פעמים · סה"כ Y ₪") - לא מנגנון הוצאות חדש.
// usageTotal מצטבר לפי הסכום שהיה בפועל בכל לחיצה (quickExpense.amount ברגע הלחיצה), ולא
// usageCount * amount הנוכחי - כך ששינוי מחיר באמצע החודש לא "מתקן" רטרואקטיבית לחיצות קודמות.
function applyQuickExpense(quickExpenseId) {
  const quickExpense = budgetData.quickExpenses.find((qe) => qe.id === quickExpenseId);
  if (!quickExpense) {
    return;
  }

  if (quickExpense.type === "fixed") {
    budgetData.expensesFixed[quickExpense.category] += quickExpense.amount;
  } else {
    budgetData.expensesVariable[quickExpense.category] += quickExpense.amount;
  }

  quickExpense.usageCount += 1;
  quickExpense.usageTotal += quickExpense.amount;

  saveData();
  fillAllInputs(); // מרעננת את שדות טופס ההוצאות, כדי שלא יישארו עם ערך ישן ויידרסו בטעות
  renderQuickExpenses(); // מרעננת את "נוסף X פעמים · סה"כ Y ₪"
  renderDashboard();
}

// כשעורכים הוצאה מהירה קיימת, שומרת כאן את ה-id שלה. null = מוספות הוצאה מהירה חדשה
let editingQuickExpenseId = null;

function openAddQuickExpenseModal() {
  editingQuickExpenseId = null;

  document.getElementById("quick-expense-modal-title").textContent = "הוספת הוצאה מהירה";
  document.getElementById("quick-expense-name-input").value = "";
  document.getElementById("quick-expense-amount-input").value = "";
  document.getElementById("quick-expense-category-input").selectedIndex = 0;
  document.getElementById("quick-expense-delete-button").style.display = "none";

  document.getElementById("quick-expense-modal-overlay").style.display = "flex";
}

function openEditQuickExpenseModal(quickExpenseId) {
  const quickExpense = budgetData.quickExpenses.find((qe) => qe.id === quickExpenseId);
  if (!quickExpense) {
    return;
  }

  editingQuickExpenseId = quickExpenseId;

  document.getElementById("quick-expense-modal-title").textContent = "עריכת הוצאה מהירה";
  document.getElementById("quick-expense-name-input").value = quickExpense.name;
  document.getElementById("quick-expense-amount-input").value = quickExpense.amount;
  document.getElementById("quick-expense-category-input").value = quickExpense.type + ":" + quickExpense.category;
  document.getElementById("quick-expense-delete-button").style.display = "inline-block";

  document.getElementById("quick-expense-modal-overlay").style.display = "flex";
}

function closeQuickExpenseModal() {
  document.getElementById("quick-expense-modal-overlay").style.display = "none";
  editingQuickExpenseId = null;
}

document.getElementById("add-quick-expense-button").addEventListener("click", openAddQuickExpenseModal);
document.getElementById("quick-expense-cancel-button").addEventListener("click", closeQuickExpenseModal);

// לחיצה על הרקע הכהה מסביב לחלון (ולא על החלון עצמו) סוגרת את המודאל
document.getElementById("quick-expense-modal-overlay").addEventListener("click", function (event) {
  if (event.target.id === "quick-expense-modal-overlay") {
    closeQuickExpenseModal();
  }
});

// מאזין לחיצה אחד על כל רשימת ההוצאות המהירות - תופס הוספה מהירה (+), עריכה, ומחיקה מהירה
document.getElementById("quick-expenses-list").addEventListener("click", function (event) {
  const addButton = event.target.closest(".quick-expense-add-button");
  if (addButton) {
    applyQuickExpense(Number(addButton.getAttribute("data-id")));
    return;
  }

  const editButton = event.target.closest(".income-source-edit");
  if (editButton) {
    openEditQuickExpenseModal(Number(editButton.getAttribute("data-id")));
    return;
  }

  const deleteButton = event.target.closest(".goal-delete");
  if (deleteButton) {
    const confirmed = confirm("למחוק את ההוצאה המהירה הזו? הוצאות שכבר נוצרו ממנה לא יימחקו. אי אפשר לשחזר את זה.");
    if (!confirmed) {
      return;
    }
    const idToDelete = Number(deleteButton.getAttribute("data-id"));
    budgetData.quickExpenses = budgetData.quickExpenses.filter((qe) => qe.id !== idToDelete);
    saveData();
    renderQuickExpenses();
  }
});

// כשלוחצים "שמור" בטופס ההוצאה המהירה (גם בהוספה וגם בעריכה):
document.getElementById("quick-expense-form").addEventListener("submit", function (event) {
  event.preventDefault();

  const name = document.getElementById("quick-expense-name-input").value.trim();
  if (!name) {
    alert("צריך לתת שם להוצאה המהירה");
    return;
  }

  const amount = parseNonNegativeAmount(document.getElementById("quick-expense-amount-input").value);
  if (amount === null) {
    alert(NEGATIVE_AMOUNT_MESSAGE);
    return;
  }

  const categoryValue = document.getElementById("quick-expense-category-input").value;
  const [type, category] = categoryValue.split(":");

  if (editingQuickExpenseId === null) {
    budgetData.quickExpenses.push({
      id: Date.now(),
      name: name,
      amount: amount,
      type: type,
      category: category,
      usageCount: 0,
      usageTotal: 0,
    });
  } else {
    const quickExpense = budgetData.quickExpenses.find((qe) => qe.id === editingQuickExpenseId);
    if (quickExpense) {
      quickExpense.name = name;
      quickExpense.amount = amount;
      quickExpense.type = type;
      quickExpense.category = category;
    }
  }

  saveData();
  closeQuickExpenseModal();
  renderQuickExpenses();
});

// כשלוחצים "מחק הוצאה מהירה" (מוצג רק במצב עריכה):
document.getElementById("quick-expense-delete-button").addEventListener("click", function () {
  const confirmed = confirm("למחוק את ההוצאה המהירה הזו? הוצאות שכבר נוצרו ממנה לא יימחקו. אי אפשר לשחזר את זה.");
  if (!confirmed) {
    return;
  }

  budgetData.quickExpenses = budgetData.quickExpenses.filter((qe) => qe.id !== editingQuickExpenseId);
  saveData();
  closeQuickExpenseModal();
  renderQuickExpenses();
});

// כשלוחצים "עדכן הוצאות":
document.getElementById("expenses-form").addEventListener("submit", function (event) {
  event.preventDefault(); // מונע רפרש של הדף

  // קודם קוראות ובודקות את כל הערכים, ורק אם כולם תקינים כותבות ל-budgetData -
  // כך שערך שלילי אחד לא משנה חלקית את הנתונים לפני שמפסיקים
  const newFixed = {};
  const newVariable = {};
  let hasNegative = false;

  fixedFields.forEach((field) => {
    const value = parseNonNegativeAmount(document.getElementById(field.id).value);
    if (value === null) hasNegative = true;
    newFixed[field.key] = value;
  });

  variableFields.forEach((field) => {
    const value = parseNonNegativeAmount(document.getElementById(field.id).value);
    if (value === null) hasNegative = true;
    newVariable[field.key] = value;
  });

  if (hasNegative) {
    alert(NEGATIVE_AMOUNT_MESSAGE);
    return;
  }

  fixedFields.forEach((field) => {
    budgetData.expensesFixed[field.key] = newFixed[field.key];
  });
  variableFields.forEach((field) => {
    budgetData.expensesVariable[field.key] = newVariable[field.key];
  });

  saveData();
  renderDashboard();
});

// כשלוחצים "עדכן תקציבים":
document.getElementById("budgets-form").addEventListener("submit", function (event) {
  event.preventDefault(); // מונע רפרש של הדף

  const newBudgets = {};
  let hasNegative = false;

  variableFields.forEach((field) => {
    const value = parseNonNegativeAmount(document.getElementById("budget-" + field.key).value);
    if (value === null) hasNegative = true;
    newBudgets[field.key] = value;
  });

  if (hasNegative) {
    alert(NEGATIVE_AMOUNT_MESSAGE);
    return;
  }

  variableFields.forEach((field) => {
    budgetData.budgets[field.key] = newBudgets[field.key];
  });

  saveData();
  renderDashboard();
});

// ===== לוח שנה פיננסי =====

// כל סוגי האירועים שאפשר לבחור, עם אייקון ועם "כיוון" (הכנסה/הוצאה) לצביעה
const eventTypes = [
  { key: "salary", label: "משכורת", icon: "💰", direction: "income" },
  { key: "extraIncome", label: "הכנסה נוספת", icon: "💵", direction: "income" },
  { key: "rent", label: "שכר דירה", icon: "🏠", direction: "expense" },
  { key: "bills", label: "חשבון / חשבונות", icon: "💡", direction: "expense" },
  { key: "savings", label: "חיסכון", icon: "💾", direction: "expense" },
  { key: "otherExpense", label: "הוצאה אחרת", icon: "💳", direction: "expense" },
];

function getEventTypeInfo(typeKey) {
  return eventTypes.find((t) => t.key === typeKey) || eventTypes[0];
}

// החודש/השנה שמוצגים כרגע בלוח (מתחילות מהחודש האמיתי הנוכחי)
let viewedYear = new Date().getFullYear();
let viewedMonth = new Date().getMonth();

// כשעורכות אירוע קיים, שומרות כאן את ה-id שלו. null = מוסיפות אירוע חדש.
let editingEventId = null;
// התאריך של התא שעליו לחצו (משמש רק כשמוסיפות אירוע חדש)
let pendingEventDate = null;

// מחזירה את כל האירועים שצריך להציג ביום נתון בחודש/שנה נתונים -
// גם אירועים חוזרים (לפי היום בחודש בלבד) וגם חד-פעמיים (לפי תאריך מלא)
function collectEventsForDay(year, month, day) {
  return budgetData.calendarEvents.filter((ev) => {
    if (ev.recurring) {
      return ev.day === day;
    }
    return ev.day === day && ev.month === month && ev.year === year;
  });
}

// אוספת את כל האירועים שצריך לקחת בחשבון בחודש/שנה נתונים (לא יום בודד אלא כל החודש) -
// לפי בדיוק אותו כלל כמו collectEventsForDay: אירוע חוזר נספר בכל חודש שבו קיים היום שלו
// (אם הוגדר יום 31 והחודש הזה קצר יותר - האירוע פשוט לא סופר בו, ולא "עובר" ליום אחר),
// ואירוע חד-פעמי נספר רק בחודש/שנה המדויקים שבו נוצר.
function collectEventsForMonth(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthEvents = budgetData.calendarEvents.filter((ev) => {
    if (ev.recurring) {
      return ev.day <= daysInMonth;
    }
    return ev.month === month && ev.year === year;
  });

  // מסדרת כרונולוגית לפי יום בחודש
  monthEvents.sort((a, b) => a.day - b.day);
  return monthEvents;
}

// מציגה את אזור "תזרים צפוי": סיכום הכנסות/הוצאות צפויות לפי אירועי הלוח של החודש
// המוצג (viewedYear/viewedMonth), ורשימה כרונולוגית עם "שינוי מצטבר".
// שימי לב: זו תחזית שמבוססת רק על אירועי לוח השנה - היא לא מחוברת (עדיין) להכנסות
// ולהוצאות בפועל שמוזנות בטפסים למעלה, ולכן היא לא משנה שום כרטיס אחר בדשבורד.
function renderCashFlowSection() {
  document.getElementById("cashflow-month-label").textContent = monthNames[viewedMonth] + " " + viewedYear;

  const monthEvents = collectEventsForMonth(viewedYear, viewedMonth);

  let totalIncome = 0;
  let totalExpense = 0;
  monthEvents.forEach((ev) => {
    const typeInfo = getEventTypeInfo(ev.type);
    if (typeInfo.direction === "income") {
      totalIncome += ev.amount;
    } else {
      totalExpense += ev.amount;
    }
  });
  const net = totalIncome - totalExpense;

  document.getElementById("cashflow-income-value").textContent = formatMoney(totalIncome);
  document.getElementById("cashflow-expenses-value").textContent = formatMoney(totalExpense);

  const netEl = document.getElementById("cashflow-net-value");
  netEl.textContent = (net >= 0 ? "+" : "−") + formatMoney(Math.abs(net));
  netEl.style.color = net >= 0 ? "var(--color-income)" : "var(--color-expenses)";

  const listContainer = document.getElementById("cashflow-list");
  listContainer.innerHTML = "";

  if (monthEvents.length === 0) {
    listContainer.innerHTML = '<div class="cashflow-empty">אין אירועים בחודש זה בלוח השנה</div>';
    return;
  }

  // "שינוי מצטבר" - סכימה רצה של האירועים לפי הסדר הכרונולוגי שלהם.
  // זו לא "יתרה" אמיתית (אין עדיין יתרת פתיחה לחודש) - רק תנועות הלוח עצמו, אחת אחרי השנייה.
  let cumulative = 0;

  monthEvents.forEach((ev) => {
    const typeInfo = getEventTypeInfo(ev.type);
    const signedAmount = typeInfo.direction === "income" ? ev.amount : -ev.amount;
    cumulative += signedAmount;

    const row = document.createElement("div");
    row.className = "cashflow-row";

    const mainDiv = document.createElement("div");
    mainDiv.className = "cashflow-row-main";

    const dateSpan = document.createElement("span");
    dateSpan.className = "cashflow-date";
    dateSpan.textContent = ev.day + "." + (viewedMonth + 1);

    const nameSpan = document.createElement("span");
    nameSpan.textContent = typeInfo.icon + " " + ev.name;

    mainDiv.appendChild(dateSpan);
    mainDiv.appendChild(nameSpan);

    const amountSpan = document.createElement("span");
    amountSpan.className = "cashflow-amount " + typeInfo.direction;
    amountSpan.textContent = (signedAmount >= 0 ? "+" : "−") + formatMoney(Math.abs(signedAmount));

    const cumulativeSpan = document.createElement("span");
    cumulativeSpan.className = "cashflow-cumulative";
    cumulativeSpan.textContent =
      "שינוי מצטבר: " + (cumulative >= 0 ? "+" : "−") + formatMoney(Math.abs(cumulative));

    row.appendChild(mainDiv);
    row.appendChild(amountSpan);
    row.appendChild(cumulativeSpan);

    listContainer.appendChild(row);
  });
}

// מציירת מחדש את כל לוח השנה - הכותרת והתאים - לפי viewedYear/viewedMonth
function renderCalendar() {
  document.getElementById("calendar-title").textContent = monthNames[viewedMonth] + " " + viewedYear;

  const grid = document.getElementById("calendar-grid");
  grid.innerHTML = "";

  const weekdayNames = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
  weekdayNames.forEach((name) => {
    const headerCell = document.createElement("div");
    headerCell.className = "calendar-weekday";
    headerCell.textContent = name;
    grid.appendChild(headerCell);
  });

  // getDay() מחזיר 0 בשביל יום ראשון - בדיוק כמו העמודה הראשונה שלנו (א׳)
  const firstWeekday = new Date(viewedYear, viewedMonth, 1).getDay();
  // אותו טריק כמו ב-getDaysInfo: "היום ה-0" של החודש הבא = היום האחרון של החודש הזה
  const daysInMonth = new Date(viewedYear, viewedMonth + 1, 0).getDate();

  const now = new Date();
  const isRealCurrentMonth = now.getFullYear() === viewedYear && now.getMonth() === viewedMonth;

  const maxEventsToShow = 2;

  // תאים ריקים לפני היום הראשון בחודש (כדי שהרשת תתחיל ביום השבוע הנכון)
  for (let i = 0; i < firstWeekday; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "calendar-day calendar-day-empty";
    grid.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day";
    cell.dataset.year = viewedYear;
    cell.dataset.month = viewedMonth;
    cell.dataset.day = day;

    if (isRealCurrentMonth && now.getDate() === day) {
      cell.classList.add("today");
    }

    const dayEvents = collectEventsForDay(viewedYear, viewedMonth, day);

    let cellHtml = '<div class="calendar-day-number">' + day + "</div>";

    dayEvents.slice(0, maxEventsToShow).forEach((ev) => {
      const typeInfo = getEventTypeInfo(ev.type);
      const sign = typeInfo.direction === "income" ? "+" : "−";
      cellHtml +=
        '<div class="calendar-event ' + typeInfo.direction + '" data-event-id="' + ev.id + '">' +
        typeInfo.icon + " " + ev.name + " " + sign + formatMoney(ev.amount) +
        "</div>";
    });

    if (dayEvents.length > maxEventsToShow) {
      cellHtml += '<div class="calendar-more">+' + (dayEvents.length - maxEventsToShow) + " נוספים</div>";
    }

    cell.innerHTML = cellHtml;
    grid.appendChild(cell);
  }

  // תאים ריקים בסוף, כדי שהרשת תסתיים בשורה מלאה (מכפולה של 7 תאים)
  const totalCellsSoFar = firstWeekday + daysInMonth;
  const trailingEmpty = (7 - (totalCellsSoFar % 7)) % 7;
  for (let i = 0; i < trailingEmpty; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "calendar-day calendar-day-empty";
    grid.appendChild(emptyCell);
  }

  // מרעננת גם את "תזרים צפוי" - כך שהיא תמיד מציגה את החודש שמוצג כרגע בלוח,
  // גם אחרי ניווט בין חודשים וגם אחרי הוספה/עריכה/מחיקה של אירוע
  renderCashFlowSection();

  // ומרעננת גם את "עד המשכורת הבאה" - כי גם היא מתבססת על אירועי לוח השנה,
  // ולכן צריכה להתעדכן באותם המקרים (ניווט, הוספה/עריכה/מחיקה של אירוע, ייבוא)
  renderNextSalarySection();

  // ואת "תחזית יתרה עד המשכורת הבאה" (שלב 13D) - מאותה הסיבה בדיוק
  renderBalanceForecastSection();
}

// ניווט בין חודשים
document.getElementById("calendar-prev-button").addEventListener("click", function () {
  viewedMonth--;
  if (viewedMonth < 0) {
    viewedMonth = 11;
    viewedYear--;
  }
  renderCalendar();
});

document.getElementById("calendar-next-button").addEventListener("click", function () {
  viewedMonth++;
  if (viewedMonth > 11) {
    viewedMonth = 0;
    viewedYear++;
  }
  renderCalendar();
});

document.getElementById("calendar-today-button").addEventListener("click", function () {
  const now = new Date();
  viewedYear = now.getFullYear();
  viewedMonth = now.getMonth();
  renderCalendar();
});

// מאזין לחיצה אחד על כל הרשת - בודקת אם לחצו על אירוע קיים (עריכה)
// או על תא יום ריק (הוספת אירוע חדש), בדיוק בשיטה שהשתמשנו בה במטרות ובהיסטוריה
document.getElementById("calendar-grid").addEventListener("click", function (event) {
  const eventEl = event.target.closest(".calendar-event");
  if (eventEl) {
    openEditEventModal(Number(eventEl.getAttribute("data-event-id")));
    return;
  }

  const dayCell = event.target.closest(".calendar-day");
  if (dayCell && !dayCell.classList.contains("calendar-day-empty")) {
    openAddEventModal(
      Number(dayCell.dataset.year),
      Number(dayCell.dataset.month),
      Number(dayCell.dataset.day)
    );
  }
});

// פותחת את המודאל במצב "הוספת אירוע חדש", עם התאריך של התא שלחצו עליו
function openAddEventModal(year, month, day) {
  editingEventId = null;
  pendingEventDate = { year: year, month: month, day: day };

  document.getElementById("event-modal-title").textContent = "הוספת אירוע";
  document.getElementById("event-type-input").value = "salary";
  document.getElementById("event-name-input").value = "";
  document.getElementById("event-amount-input").value = "";
  document.getElementById("event-day-input").value = day;
  document.getElementById("event-recurring-input").checked = false;
  document.getElementById("event-delete-button").style.display = "none";

  document.getElementById("event-modal-overlay").style.display = "flex";
}

// פותחת את המודאל במצב "עריכת אירוע קיים", עם כל הפרטים שלו ממולאים מראש
function openEditEventModal(eventId) {
  const ev = budgetData.calendarEvents.find((e) => e.id === eventId);
  if (!ev) {
    return;
  }

  editingEventId = eventId;
  pendingEventDate = { year: ev.year, month: ev.month, day: ev.day };

  document.getElementById("event-modal-title").textContent = "עריכת אירוע";
  document.getElementById("event-type-input").value = ev.type;
  document.getElementById("event-name-input").value = ev.name;
  document.getElementById("event-amount-input").value = ev.amount;
  document.getElementById("event-day-input").value = ev.day;
  document.getElementById("event-recurring-input").checked = ev.recurring;
  document.getElementById("event-delete-button").style.display = "inline-block";

  document.getElementById("event-modal-overlay").style.display = "flex";
}

function closeEventModal() {
  document.getElementById("event-modal-overlay").style.display = "none";
  editingEventId = null;
  pendingEventDate = null;
}

document.getElementById("event-cancel-button").addEventListener("click", closeEventModal);

// לחיצה על הרקע הכהה מסביב לחלון (ולא על החלון עצמו) סוגרת את המודאל
document.getElementById("event-modal-overlay").addEventListener("click", function (event) {
  if (event.target.id === "event-modal-overlay") {
    closeEventModal();
  }
});

// כשלוחצים "שמור" בטופס האירוע (גם בהוספה וגם בעריכה):
document.getElementById("event-form").addEventListener("submit", function (event) {
  event.preventDefault();

  const name = document.getElementById("event-name-input").value.trim();
  if (!name) {
    alert("צריך לתת שם/תיאור לאירוע");
    return;
  }

  const type = document.getElementById("event-type-input").value;
  const amount = parseNonNegativeAmount(document.getElementById("event-amount-input").value);
  if (amount === null) {
    alert(NEGATIVE_AMOUNT_MESSAGE);
    return;
  }
  const day = Number(document.getElementById("event-day-input").value) || pendingEventDate.day;
  const recurring = document.getElementById("event-recurring-input").checked;

  if (editingEventId === null) {
    // אירוע חדש - נוצר בתאריך של התא שלחצו עליו
    budgetData.calendarEvents.push({
      id: Date.now(),
      type: type,
      name: name,
      amount: amount,
      day: day,
      recurring: recurring,
      year: pendingEventDate.year,
      month: pendingEventDate.month,
    });
  } else {
    // עדכון אירוע קיים - מוצאות אותו לפי id ומעדכנות את השדות שלו
    const ev = budgetData.calendarEvents.find((e) => e.id === editingEventId);
    if (ev) {
      ev.type = type;
      ev.name = name;
      ev.amount = amount;
      ev.day = day;
      ev.recurring = recurring;
    }
  }

  saveData();
  closeEventModal();
  renderCalendar();
});

// כשלוחצים "מחק אירוע" (מוצג רק במצב עריכה):
document.getElementById("event-delete-button").addEventListener("click", function () {
  const confirmed = confirm("למחוק את האירוע הזה?");
  if (!confirmed) {
    return;
  }

  budgetData.calendarEvents = budgetData.calendarEvents.filter((e) => e.id !== editingEventId);
  saveData();
  closeEventModal();
  renderCalendar();
});

// ===== יתרה נוכחית ועד המשכורת הבאה =====
// הערה חשובה: כל החישובים בסקשן הזה הם תחזית, בדיוק כמו "תזרים צפוי" למעלה -
// הם משתמשים באירועי לוח השנה ובשדה currentBalance בלבד, ולא נוגעים בהכנסות/הוצאות/חיסכון
// בפועל, וגם לא בכרטיס הקיים "מותר להוציא היום" (renderSpendingLimitCard) - הוא ממשיך
// לעבוד בדיוק כמו קודם, וזה סקשן נוסף ונפרד בלבד.

// מציגה את הערך השמור של היתרה הנוכחית, גם בכרטיס וגם בשדה הקלט
function renderBalanceCard() {
  document.getElementById("balance-value").textContent = formatMoney(budgetData.currentBalance);
  document.getElementById("balance-input").value = budgetData.currentBalance;
}

// כשלוחצים "שמור" בכרטיס היתרה הנוכחית:
document.getElementById("balance-save-button").addEventListener("click", function () {
  const newBalance = parseNonNegativeAmount(document.getElementById("balance-input").value);

  if (newBalance === null) {
    alert(NEGATIVE_AMOUNT_MESSAGE);
    return;
  }

  budgetData.currentBalance = newBalance;

  saveData();
  renderBalanceCard();
  renderNextSalarySection(); // כי "עד המשכורת הבאה" מתבסס גם על היתרה הנוכחית
  renderBalanceForecastSection(); // וגם התחזית (13D) מתבססת על היתרה הנוכחית
});

// מחזירה את התאריך (כאובייקט Date, בלי שעה) של המופע הקרוב ביותר של אירוע נתון,
// שמגיע ביום fromDate או אחריו. אירוע חד-פעמי - התאריך המדויק שלו (או null אם הוא בעבר).
// אירוע חוזר - מחפשת חודש-חודש קדימה, ומדלגת על חודשים שאין בהם את היום שהוגדר
// (למשל יום 31 בפברואר) בלי "להזיז" את האירוע ליום אחר.
function getNextOccurrenceDate(event, fromDate) {
  if (!event.recurring) {
    const eventDate = new Date(event.year, event.month, event.day);
    return eventDate >= fromDate ? eventDate : null;
  }

  let year = fromDate.getFullYear();
  let month = fromDate.getMonth();

  // 60 חודשים (5 שנים) זה הגבלה בטיחותית בלבד - בפועל אירוע חוזר תמיד ימצא מופע הרבה לפני כן
  for (let i = 0; i < 60; i++) {
    const daysInThisMonth = new Date(year, month + 1, 0).getDate();
    if (event.day <= daysInThisMonth) {
      const candidateDate = new Date(year, month, event.day);
      if (candidateDate >= fromDate) {
        return candidateDate;
      }
    }
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }
  return null;
}

// אוספת את כל מופעי האירועים (כולל חוזרים) שחלים בטווח [startDate, endDateExclusive) -
// עוברת חודש-חודש כדי לא לפספס אירועים שהטווח שלהם חוצה בין חודשים
function getEventsInRange(startDate, endDateExclusive) {
  const results = [];
  let year = startDate.getFullYear();
  let month = startDate.getMonth();

  while (
    year < endDateExclusive.getFullYear() ||
    (year === endDateExclusive.getFullYear() && month <= endDateExclusive.getMonth())
  ) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    budgetData.calendarEvents.forEach((ev) => {
      const occursThisMonth = ev.recurring
        ? ev.day <= daysInMonth
        : ev.month === month && ev.year === year;

      if (!occursThisMonth) {
        return;
      }

      const occurrenceDate = new Date(year, month, ev.day);
      if (occurrenceDate >= startDate && occurrenceDate < endDateExclusive) {
        results.push({ event: ev, date: occurrenceDate });
      }
    });

    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  results.sort((a, b) => a.date - b.date);
  return results;
}

// מוצאת את אירוע ה"משכורת" (type === "salary") שהמופע הקרוב שלו הוא המוקדם ביותר
// מבין כל אירועי המשכורת - זו "המשכורת הבאה". מחזירה null אם אין אף אחד בעתיד.
function findNextSalaryEvent(fromDate) {
  let earliest = null;

  budgetData.calendarEvents
    .filter((ev) => ev.type === "salary")
    .forEach((ev) => {
      const occurrence = getNextOccurrenceDate(ev, fromDate);
      if (occurrence && (!earliest || occurrence < earliest.date)) {
        earliest = { event: ev, date: occurrence };
      }
    });

  return earliest;
}

// מציגה את סקשן "עד המשכורת הבאה": תאריך המשכורת הבאה, כמה כסף צפוי להיות זמין
// לפני שהיא נכנסת (יתרה נוכחית + תנועות לוח השנה מהיום ועד לפני המשכורת, בלי המשכורת עצמה),
// וכמה אפשר להוציא ביום בממוצע עד אז.
function renderNextSalarySection() {
  const dateLineEl = document.getElementById("next-salary-date-line");
  const moneyEl = document.getElementById("money-before-salary-value");
  const allowanceLabelEl = document.getElementById("daily-allowance-label");
  const allowanceValueEl = document.getElementById("daily-allowance-value");

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const nextSalary = findNextSalaryEvent(today);

  if (!nextSalary) {
    dateLineEl.textContent = "💰 המשכורת הבאה: לא הוגדרה משכורת עתידית בלוח השנה";
    moneyEl.textContent = "—";
    moneyEl.style.color = "";
    allowanceLabelEl.textContent = "💸 אפשר להוציא עד המשכורת הבאה";
    allowanceValueEl.textContent = "—";
    allowanceValueEl.style.color = "";
    return;
  }

  const salaryDate = nextSalary.date;
  const daysUntilSalary = Math.round((salaryDate - today) / 86400000);

  const yearSuffix = salaryDate.getFullYear() !== today.getFullYear() ? " " + salaryDate.getFullYear() : "";
  const dateText = salaryDate.getDate() + " ב" + monthNames[salaryDate.getMonth()] + yearSuffix;

  dateLineEl.textContent =
    daysUntilSalary <= 0
      ? "💰 המשכורת הבאה: " + dateText + " (היום)"
      : "💰 המשכורת הבאה: " + dateText + " · בעוד " + daysUntilSalary + " ימים";

  // כל התנועות מהיום ועד (לא כולל) יום המשכורת הבאה - בלי המשכורת עצמה
  const eventsBeforeSalary = getEventsInRange(today, salaryDate);

  let moneyBeforeSalary = budgetData.currentBalance;
  eventsBeforeSalary.forEach((item) => {
    const typeInfo = getEventTypeInfo(item.event.type);
    moneyBeforeSalary += typeInfo.direction === "income" ? item.event.amount : -item.event.amount;
  });

  moneyEl.textContent = (moneyBeforeSalary >= 0 ? "" : "−") + formatMoney(Math.abs(moneyBeforeSalary));
  moneyEl.style.color = moneyBeforeSalary >= 0 ? "var(--color-income)" : "var(--color-expenses)";

  if (moneyBeforeSalary <= 0) {
    // אין מספיק כסף עד המשכורת הבאה - מציגות אזהרה במקום מספר יומי חיובי
    allowanceLabelEl.textContent = "⚠️ אין מספיק כסף עד המשכורת הבאה";
    allowanceValueEl.textContent = "חסרים " + formatMoney(Math.abs(moneyBeforeSalary));
    allowanceValueEl.style.color = "var(--color-expenses)";
  } else if (daysUntilSalary <= 0) {
    // המשכורת הבאה היא היום עצמו - אין "ימים לפני" לחלק ביניהם
    allowanceLabelEl.textContent = "💸 אפשר להוציא עד המשכורת הבאה";
    allowanceValueEl.textContent = "המשכורת הבאה היא היום";
    allowanceValueEl.style.color = "";
  } else {
    const dailyAmount = moneyBeforeSalary / daysUntilSalary;
    allowanceLabelEl.textContent = "💸 אפשר להוציא עד המשכורת הבאה";
    allowanceValueEl.textContent =
      formatMoney(Math.round(dailyAmount)) + " ליום · " + daysUntilSalary + " ימים עד המשכורת הבאה";
    allowanceValueEl.style.color = "var(--color-income)";
  }
}

// מציגה את סקשן "תחזית יתרה עד המשכורת הבאה" (שלב 13D): רשימה כרונולוגית של האירועים
// מהיום ועד (לא כולל) המשכורת הבאה, עם היתרה הצפויה אחרי כל אחד מהם, ואז המשכורת עצמה
// כנקודת סיום נפרדת. משתמשת באותה לוגיקה ובאותם הנתונים בדיוק כמו "עד המשכורת הבאה"
// (findNextSalaryEvent / getEventsInRange מ-13C) - בלי ליצור מערכת אירועים מקבילה.
function renderBalanceForecastSection() {
  const listContainer = document.getElementById("balance-forecast-list");
  const salaryLineEl = document.getElementById("balance-forecast-salary-line");
  const warningEl = document.getElementById("balance-forecast-warning");
  const moneyEl = document.getElementById("balance-forecast-money-value");
  const dailyEl = document.getElementById("balance-forecast-daily-value");

  listContainer.innerHTML = "";
  salaryLineEl.textContent = "";
  warningEl.style.display = "none";
  warningEl.textContent = "";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nextSalary = findNextSalaryEvent(today);

  if (!nextSalary) {
    listContainer.innerHTML = '<div class="cashflow-empty">לא הוגדרה משכורת עתידית בלוח השנה - אין תחזית להציג</div>';
    moneyEl.textContent = "—";
    moneyEl.style.color = "";
    dailyEl.textContent = "—";
    return;
  }

  const salaryDate = nextSalary.date;
  // כל האירועים מהיום ועד (לא כולל) יום המשכורת הבאה, ממוינים כרונולוגית - בדיוק כמו ב-13C
  const eventsBeforeSalary = getEventsInRange(today, salaryDate);

  if (eventsBeforeSalary.length === 0) {
    listContainer.innerHTML = '<div class="cashflow-empty">אין אירועים בלוח השנה עד המשכורת הבאה</div>';
  }

  let runningBalance = budgetData.currentBalance;
  let shortage = null; // {date, amount} - הפעם הראשונה שבה היתרה יורדת מתחת ל-0

  eventsBeforeSalary.forEach((item) => {
    const typeInfo = getEventTypeInfo(item.event.type);
    const signedAmount = typeInfo.direction === "income" ? item.event.amount : -item.event.amount;
    runningBalance += signedAmount;

    if (runningBalance < 0 && !shortage) {
      shortage = { date: item.date, amount: Math.abs(runningBalance) };
    }

    const row = document.createElement("div");
    row.className = "cashflow-row";

    const mainDiv = document.createElement("div");
    mainDiv.className = "cashflow-row-main";

    const dateSpan = document.createElement("span");
    dateSpan.className = "cashflow-date";
    dateSpan.textContent = item.date.getDate() + "." + (item.date.getMonth() + 1);

    const nameSpan = document.createElement("span");
    nameSpan.textContent = typeInfo.icon + " " + item.event.name;

    mainDiv.appendChild(dateSpan);
    mainDiv.appendChild(nameSpan);

    const amountSpan = document.createElement("span");
    amountSpan.className = "cashflow-amount " + typeInfo.direction;
    amountSpan.textContent = (signedAmount >= 0 ? "+" : "−") + formatMoney(Math.abs(signedAmount));

    const balanceSpan = document.createElement("span");
    balanceSpan.className = "cashflow-cumulative";
    balanceSpan.textContent = "יתרה לאחר האירוע: " + formatMoney(runningBalance);

    row.appendChild(mainDiv);
    row.appendChild(amountSpan);
    row.appendChild(balanceSpan);
    listContainer.appendChild(row);
  });

  // המשכורת הבאה - מוצגת בנפרד כנקודת הסיום, ולא נכללת בחישוב "היתרה לפני המשכורת"
  const salaryTypeInfo = getEventTypeInfo(nextSalary.event.type);
  salaryLineEl.textContent =
    salaryDate.getDate() + "." + (salaryDate.getMonth() + 1) + " — " +
    salaryTypeInfo.icon + " " + nextSalary.event.name + " +" + formatMoney(nextSalary.event.amount);

  moneyEl.textContent = (runningBalance >= 0 ? "" : "−") + formatMoney(Math.abs(runningBalance));
  moneyEl.style.color = runningBalance >= 0 ? "var(--color-income)" : "var(--color-expenses)";

  const daysUntilSalary = Math.round((salaryDate - today) / 86400000);
  if (runningBalance > 0 && daysUntilSalary > 0) {
    dailyEl.textContent = formatMoney(Math.round(runningBalance / daysUntilSalary)) + " ליום";
  } else {
    dailyEl.textContent = "—";
  }

  if (shortage) {
    warningEl.style.display = "block";
    warningEl.textContent =
      "⚠️ היתרה צפויה לרדת מתחת ל-0 לפני המשכורת הבאה · " +
      shortage.date.getDate() + "." + (shortage.date.getMonth() + 1) +
      " — צפוי חוסר של " + formatMoney(shortage.amount);
  }
}

// ===== App Shell: ניווט עליון/תחתון + Quick Actions (שלב UI-1) =====
// זה שלב UI בלבד: כל כפתור ניווט רק גולל (scrollIntoView) אל section קיים בעמוד, ומסמן
// את עצמו כ"פעיל". זה עדיין אותו עמוד רציף אחד - לא נבנה כאן מנגנון views/routing אמיתי,
// ולא נוצר/נמחק/שונה שום נתון, חישוב, או פונקציית render קיימת. הפעולות ב"מה תרצי להוסיף?"
// מחוברות לפונקציות הקיימות (openAddIncomeSourceModal/openAddQuickExpenseModal) בלבד,
// או לגלילה+פוקוס לטופס הקיים - בלי שום טופס/מודאל הוספה חדש.

// גוללת בעדינות אל ה-section עם ה-id הנתון (אם קיים), ומסמנת את כל כפתורי הניווט
// (עליון ותחתון) ששייכים אליו כ-active - כפתור אחר לא שייך לאותו target מאבד את הסימון
function scrollToNavTarget(targetId) {
  const targetEl = document.getElementById(targetId);
  if (targetEl) {
    targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.querySelectorAll(".nav-link, .bottom-nav-link").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-scroll-target") === targetId);
  });
}

document.querySelectorAll(".nav-link, .bottom-nav-link").forEach((btn) => {
  const targetId = btn.getAttribute("data-scroll-target");
  if (!targetId) {
    return; // כפתורי "+"/"עוד" בניווט התחתון לא גוללים בעצמם - יש להם handler נפרד למטה
  }
  btn.addEventListener("click", function () {
    scrollToNavTarget(targetId);
  });
});

// "מה תרצי להוסיף?" - נפתח מכפתור ה-"+" בניווט התחתון
document.getElementById("quick-actions-button").addEventListener("click", function () {
  document.getElementById("quick-actions-overlay").style.display = "flex";
});

function closeQuickActionsOverlay() {
  document.getElementById("quick-actions-overlay").style.display = "none";
}

document.getElementById("quick-actions-close-button").addEventListener("click", closeQuickActionsOverlay);
document.getElementById("quick-actions-overlay").addEventListener("click", function (event) {
  if (event.target.id === "quick-actions-overlay") {
    closeQuickActionsOverlay();
  }
});

document.getElementById("quick-action-expense").addEventListener("click", function () {
  closeQuickActionsOverlay();
  scrollToNavTarget("expenses-section");
  const firstExpenseInput = document.getElementById(fixedFields[0].id);
  if (firstExpenseInput) {
    firstExpenseInput.focus({ preventScroll: true });
  }
});

document.getElementById("quick-action-income").addEventListener("click", function () {
  closeQuickActionsOverlay();
  openAddIncomeSourceModal(); // פונקציה קיימת - לא נוצר כאן טופס חדש. פותחת מודאל מלא-מסך, אז אין צורך לגלול קודם
});

document.getElementById("quick-action-quick-expense").addEventListener("click", function () {
  closeQuickActionsOverlay();
  openAddQuickExpenseModal(); // פונקציה קיימת - לא נוצר כאן טופס חדש. פותחת מודאל מלא-מסך, אז אין צורך לגלול קודם
});

document.getElementById("quick-action-goal").addEventListener("click", function () {
  closeQuickActionsOverlay();
  scrollToNavTarget("goals-section");
  const goalNameInput = document.getElementById("goal-name");
  if (goalNameInput) {
    goalNameInput.focus({ preventScroll: true });
  }
});

// "עוד" - יעדי ניווט שלא נכנסים לניווט התחתון הקומפקטי
document.getElementById("more-nav-button").addEventListener("click", function () {
  document.getElementById("more-nav-overlay").style.display = "flex";
});

function closeMoreNavOverlay() {
  document.getElementById("more-nav-overlay").style.display = "none";
}

document.getElementById("more-nav-close-button").addEventListener("click", closeMoreNavOverlay);
document.getElementById("more-nav-overlay").addEventListener("click", function (event) {
  if (event.target.id === "more-nav-overlay") {
    closeMoreNavOverlay();
  }
});

document.querySelectorAll("#more-nav-overlay .quick-action-item").forEach((btn) => {
  btn.addEventListener("click", function () {
    closeMoreNavOverlay();
    scrollToNavTarget(btn.getAttribute("data-scroll-target"));
  });
});

// מציגות את הכל פעם אחת כשהעמוד נטען
document.getElementById("current-month-label").textContent = getCurrentMonthLabel();
document.getElementById("home-month-label").textContent = getCurrentMonthLabel(); // כותרת Home (UI-2a) - אותה פונקציה קיימת, לא חישוב תאריך חדש
populateQuickExpenseCategoryOptions();
renderIncomeSources();
renderQuickExpenses();
renderSavingsGoals();
renderHistoryTable();
renderDashboard();
renderBalanceCard();
renderCalendar(); // renderCalendar קוראת גם ל-renderCashFlowSection, ל-renderNextSalarySection ול-renderBalanceForecastSection

// ===== רישום Service Worker (שלב 17 - PWA) =====
// זה לא נוגע בשום נתון או חישוב - רק מבקש מהדפדפן "לזכור" את קבצי האפליקציה,
// כדי שהיא תיפתח גם בלי אינטרנט. אם הדפדפן לא תומך ב-Service Worker (או שיש
// שגיאה בהרשמה) - לא קורה שום דבר רע, האפליקציה ממשיכה לעבוד כרגיל כמו היום.
// הנתיב "service-worker.js" (בלי "/" בהתחלה) כדי שזה יעבוד גם אם התיקייה הזו
// לא נמצאת ב-root של הדומיין.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("service-worker.js").catch(function (error) {
      console.log("רישום Service Worker נכשל (לא קריטי - האפליקציה ממשיכה לעבוד כרגיל):", error);
    });
  });
}
