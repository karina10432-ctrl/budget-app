// ה"מצב" (state) של האפליקציה - כל הנתונים שלנו יושבים כאן, במקום אחד.
// שימי לב: זה עם let ולא const - כי בעוד רגע (loadData) אנחנו עשויות להחליף
// את כל האובייקט הזה בנתונים שנטענו מה-localStorage.
let budgetData = {
  income: {
    salary: 8000,
    other: 0,
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

// פונקציה קטנה שמעצבת מספר כסף עם ₪ ופסיקים (למשל 8000 -> ₪8,000)
function formatMoney(amount) {
  return "₪" + amount.toLocaleString("he-IL");
}

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

// בודקת שלכל השדות שהוספנו במהלך הדרך (תקציבים, מטרות, היסטוריה, לוח שנה)
// יש ברירת מחדל, גם אם budgetData הגיע מגיבוי ישן שנוצר לפני שהם היו קיימים.
// זה מונע קריסה כשהקוד מנסה לקרוא, למשל, budgets.super ממקום שלא קיים.
// הפונקציה הזו רצה גם בטעינת הדף וגם אחרי ייבוא גיבוי.
function ensureBackwardCompatibleFields() {
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

// מסכמת את ההכנסה הכוללת (משכורת + הכנסה נוספת) - חילצתי את זה לפונקציה קטנה
// כדי שגם "סיכום החודש" (שלב 14) יוכל להשתמש באותו חישוב בדיוק, בלי לחשב את זה בנפרד
function calculateTotalIncome() {
  return budgetData.income.salary + budgetData.income.other;
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
  const totalIncome = budgetData.income.salary + budgetData.income.other;
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
      '<button class="goal-delete" data-id="' + goal.id + '">🗑️</button>' +
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
      '<td><button class="history-delete" data-id="' + month.id + '">🗑️</button></td>';
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

  const totalIncome = budgetData.income.salary + budgetData.income.other;
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
  budgetData.income.salary = 0;
  budgetData.income.other = 0;
  fixedFields.forEach((field) => {
    budgetData.expensesFixed[field.key] = 0;
  });
  variableFields.forEach((field) => {
    budgetData.expensesVariable[field.key] = 0;
  });

  saveData();

  // מרעננות את השדות בטפסים כדי שיציגו 0, ולא את המספרים הישנים
  document.getElementById("salary-input").value = 0;
  document.getElementById("other-income-input").value = 0;
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

  const newGoal = {
    id: Date.now(), // מספר שמשתנה כל מילישנייה - מתאים כ"תעודת זהות" ייחודית למטרה
    name: name,
    target: Number(document.getElementById("goal-target").value) || 0,
    saved: Number(document.getElementById("goal-saved").value) || 0,
    monthlyDeposit: Number(document.getElementById("goal-monthly").value) || 0,
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

// ממלאת את כל שדות הטפסים (הכנסה, הוצאות, תקציבים) לפי מה שיש כרגע ב-budgetData.
// זה קוד שהיה פעם כתוב ישירות כאן (רק בטעינת הדף), והוצאתי אותו לפונקציה נפרדת
// כדי שנוכל להריץ אותו שוב גם אחרי ייבוא גיבוי - ההתנהגות שלו לא השתנתה.
function fillAllInputs() {
  document.getElementById("salary-input").value = budgetData.income.salary;
  document.getElementById("other-income-input").value = budgetData.income.other;

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

// בודקת שהאובייקט שקיבלנו (מקובץ שיובא) נראה כמו budgetData אמיתי -
// כלומר שיש בו את כל החלקים שהאפליקציה מכירה, מהסוג הנכון.
function isValidBudgetData(data) {
  if (!data || typeof data !== "object") {
    return false;
  }
  if (!data.income || typeof data.income.salary !== "number" || typeof data.income.other !== "number") {
    return false;
  }
  if (!data.expensesFixed || typeof data.expensesFixed !== "object") {
    return false;
  }
  if (!data.expensesVariable || typeof data.expensesVariable !== "object") {
    return false;
  }
  if (!data.budgets || typeof data.budgets !== "object") {
    return false;
  }
  if (!Array.isArray(data.savingsGoals)) {
    return false;
  }
  if (!Array.isArray(data.history)) {
    return false;
  }
  return true;
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

    if (!isValidBudgetData(parsedData)) {
      alert("הקובץ אינו בפורמט שהאפליקציה מכירה. ודאי שזה קובץ גיבוי שיוצא מהאפליקציה הזו.");
      event.target.value = "";
      return;
    }

    const confirmed = confirm("ייבוא גיבוי יחליף את הנתונים הקיימים. להמשיך?");
    if (!confirmed) {
      event.target.value = "";
      return;
    }

    budgetData = parsedData;
    ensureBackwardCompatibleFields(); // למקרה שהקובץ המיובא נוצר לפני שהיו לנו כל השדות
    saveData();

    // מרעננות את כל התצוגה - הטפסים, הדשבורד, המטרות, ההיסטוריה, לוח השנה והיתרה - עם הנתונים שיובאו
    fillAllInputs();
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

// כשלוחצים "עדכן הכנסה":
document.getElementById("income-form").addEventListener("submit", function (event) {
  event.preventDefault(); // מונע רפרש של הדף

  const salary = Number(document.getElementById("salary-input").value) || 0;
  const other = Number(document.getElementById("other-income-input").value) || 0;

  budgetData.income.salary = salary;
  budgetData.income.other = other;

  saveData();
  renderDashboard();
});

// כשלוחצים "עדכן הוצאות":
document.getElementById("expenses-form").addEventListener("submit", function (event) {
  event.preventDefault(); // מונע רפרש של הדף

  fixedFields.forEach((field) => {
    const value = Number(document.getElementById(field.id).value) || 0;
    budgetData.expensesFixed[field.key] = value;
  });

  variableFields.forEach((field) => {
    const value = Number(document.getElementById(field.id).value) || 0;
    budgetData.expensesVariable[field.key] = value;
  });

  saveData();
  renderDashboard();
});

// כשלוחצים "עדכן תקציבים":
document.getElementById("budgets-form").addEventListener("submit", function (event) {
  event.preventDefault(); // מונע רפרש של הדף

  variableFields.forEach((field) => {
    const value = Number(document.getElementById("budget-" + field.key).value) || 0;
    budgetData.budgets[field.key] = value;
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
  const amount = Number(document.getElementById("event-amount-input").value) || 0;
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
  const newBalance = Number(document.getElementById("balance-input").value) || 0;
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

// מציגות את הכל פעם אחת כשהעמוד נטען
document.getElementById("current-month-label").textContent = getCurrentMonthLabel();
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
