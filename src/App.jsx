import React, { useState, useEffect, useRef, useMemo } from "react";

/* ------------------------------------------------------------------ *
 *  BEIT AL SIDR — table-side ordering
 *  Guest surface for the QR / NFC ordering platform.
 * ------------------------------------------------------------------ */

const EDIT_WINDOW_SEC = 90;
const SERVICE_RATE = 0.10;
const TAX_RATE = 0.16;

/* ---------------------------- option groups ---------------------------- */

const G = {
  breadHummus: {
    id: "bread", name: "Bread", nameAr: "الخبز", type: "single", required: true,
    options: [
      { id: "arabic", name: "Arabic bread", nameAr: "خبز عربي", price: 0 },
      { id: "brown", name: "Whole wheat", nameAr: "خبز أسمر", price: 0.25 },
      { id: "gf", name: "Gluten-free", nameAr: "خالٍ من الغلوتين", price: 0.75 },
      { id: "none", name: "No bread", nameAr: "بدون خبز", price: 0 },
    ],
  },
  hummusTop: {
    id: "top", name: "Topping", nameAr: "الإضافات", type: "multi", required: false,
    options: [
      { id: "pine", name: "Toasted pine nuts", nameAr: "صنوبر محمّص", price: 1.0 },
      { id: "lamb", name: "Minced lamb", nameAr: "لحمة مفرومة", price: 2.5 },
      { id: "oil", name: "Extra olive oil", nameAr: "زيت زيتون إضافي", price: 0 },
      { id: "chilli", name: "Chilli & sumac", nameAr: "فليفلة وسمّاق", price: 0.5 },
    ],
  },
  mezzeSize: {
    id: "size", name: "Portion", nameAr: "الحجم", type: "single", required: true,
    options: [
      { id: "s", name: "Small", nameAr: "صغير", price: 0 },
      { id: "l", name: "Large (shares 3–4)", nameAr: "كبير (يكفي ٣–٤)", price: 2.0 },
    ],
  },
  doneness: {
    id: "done", name: "Cooked", nameAr: "درجة النضج", type: "single", required: true,
    options: [
      { id: "medium", name: "Medium", nameAr: "وسط", price: 0 },
      { id: "mediumwell", name: "Medium well", nameAr: "وسط مائل للنضج", price: 0 },
      { id: "well", name: "Well done", nameAr: "ناضج تماماً", price: 0 },
    ],
  },
  spice: {
    id: "spice", name: "Heat", nameAr: "الحرارة", type: "single", required: true,
    options: [
      { id: "none", name: "Not spicy", nameAr: "غير حار", price: 0 },
      { id: "mild", name: "Mild", nameAr: "خفيف", price: 0 },
      { id: "hot", name: "Hot", nameAr: "حار", price: 0 },
    ],
  },
  grillSide: {
    id: "side", name: "Side", nameAr: "الطبق الجانبي", type: "single", required: true,
    options: [
      { id: "rice", name: "Vermicelli rice", nameAr: "أرز بالشعيرية", price: 0 },
      { id: "fries", name: "Fries", nameAr: "بطاطا مقلية", price: 0 },
      { id: "grilled", name: "Grilled vegetables", nameAr: "خضار مشوية", price: 0.75 },
      { id: "salad", name: "Green salad", nameAr: "سلطة خضراء", price: 0.75 },
    ],
  },
  grillExtra: {
    id: "extra", name: "Add on", nameAr: "إضافات", type: "multi", required: false,
    options: [
      { id: "garlic", name: "Garlic paste", nameAr: "ثومية", price: 0.5 },
      { id: "hummus", name: "Side of hummus", nameAr: "صحن حمص", price: 2.0 },
      { id: "skewer", name: "Extra skewer", nameAr: "سيخ إضافي", price: 3.5 },
    ],
  },
  mansafPortion: {
    id: "portion", name: "Portion", nameAr: "الحجم", type: "single", required: true,
    options: [
      { id: "one", name: "One person", nameAr: "لشخص واحد", price: 0 },
      { id: "two", name: "Two people", nameAr: "لشخصين", price: 9.0 },
      { id: "tray", name: "Sharing tray (4–5)", nameAr: "صينية (٤–٥)", price: 22.0 },
    ],
  },
  mansafExtra: {
    id: "extra", name: "Add on", nameAr: "إضافات", type: "multi", required: false,
    options: [
      { id: "jameed", name: "Extra jameed sauce", nameAr: "مرقة جميد إضافية", price: 1.5 },
      { id: "nuts", name: "Extra almonds & pine nuts", nameAr: "لوز وصنوبر إضافي", price: 1.75 },
      { id: "shank", name: "Lamb shank cut", nameAr: "قطعة موزة", price: 4.0 },
    ],
  },
  cheeseType: {
    id: "cheese", name: "Cheese", nameAr: "نوع الجبنة", type: "single", required: true,
    options: [
      { id: "akkawi", name: "Akkawi", nameAr: "عكاوي", price: 0 },
      { id: "nabulsi", name: "Nabulsi", nameAr: "نابلسي", price: 0.5 },
      { id: "mix", name: "Mixed cheese", nameAr: "جبنة مشكّلة", price: 0.75 },
    ],
  },
  sajExtra: {
    id: "extra", name: "Add on", nameAr: "إضافات", type: "multi", required: false,
    options: [
      { id: "veg", name: "Tomato, mint, olives", nameAr: "بندورة ونعناع وزيتون", price: 0.5 },
      { id: "sujuk", name: "Sujuk", nameAr: "سجق", price: 1.25 },
      { id: "roll", name: "Rolled", nameAr: "ملفوف", price: 0 },
    ],
  },
  sugar: {
    id: "sugar", name: "Sugar", nameAr: "السكر", type: "single", required: true,
    options: [
      { id: "none", name: "No sugar", nameAr: "بدون سكر", price: 0 },
      { id: "light", name: "Lightly sweet", nameAr: "سكر خفيف", price: 0 },
      { id: "full", name: "Sweet", nameAr: "سكر زيادة", price: 0 },
    ],
  },
  ice: {
    id: "ice", name: "Ice", nameAr: "الثلج", type: "single", required: true,
    options: [
      { id: "yes", name: "With ice", nameAr: "مع ثلج", price: 0 },
      { id: "no", name: "No ice", nameAr: "بدون ثلج", price: 0 },
    ],
  },
  knafehSize: {
    id: "size", name: "Portion", nameAr: "الحجم", type: "single", required: true,
    options: [
      { id: "piece", name: "Single piece", nameAr: "قطعة", price: 0 },
      { id: "half", name: "Half kilo tray", nameAr: "نص كيلو", price: 5.5 },
    ],
  },
};

/* ------------------------------- menu -------------------------------- */

const CATEGORIES = [
  { id: "mezze", name: "Mezze", nameAr: "مقبلات" },
  { id: "saj", name: "From the Saj", nameAr: "من الصاج" },
  { id: "grills", name: "Grills", nameAr: "المشاوي" },
  { id: "mains", name: "Mains", nameAr: "الأطباق الرئيسية" },
  { id: "sweets", name: "Sweets", nameAr: "الحلويات" },
  { id: "drinks", name: "Drinks", nameAr: "المشروبات" },
];

const MENU = [
  { id: "hummus", cat: "mezze", name: "Hummus Beiruti", nameAr: "حمص بيروتي", price: 3.75, min: 6,
    desc: "Chickpeas whipped with tahini, lemon and garlic, finished with parsley and olive oil.",
    descAr: "حمص مخفوق مع الطحينة والليمون والثوم، مع بقدونس وزيت زيتون.",
    tags: ["vegan", "popular"], allergens: ["sesame"], emoji: "🥣", hue: 44,
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Lebanese_style_hummus.jpg/500px-Lebanese_style_hummus.jpg",
    groups: [G.mezzeSize, G.breadHummus, G.hummusTop] },

  { id: "mutabbal", cat: "mezze", name: "Mutabbal", nameAr: "متبل باذنجان", price: 3.50, min: 6,
    desc: "Charred aubergine folded through tahini and yoghurt, topped with pomegranate.",
    descAr: "باذنجان مشوي على الفحم مع طحينة ولبن، مزيّن بحب الرمان.",
    tags: ["vegetarian"], allergens: ["sesame", "dairy"], emoji: "🍆", hue: 280,
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Baba_Ganoush_05of05_%288735238183%29.jpg/500px-Baba_Ganoush_05of05_%288735238183%29.jpg",
    groups: [G.mezzeSize, G.breadHummus] },

  { id: "fattoush", cat: "mezze", name: "Fattoush", nameAr: "فتوش", price: 4.25, min: 7,
    desc: "Garden vegetables, purslane and toasted bread in a sumac and pomegranate dressing.",
    descAr: "خضار طازجة وبقلة وخبز محمّص مع دبس رمان وسمّاق.",
    tags: ["vegan"], allergens: ["gluten"], emoji: "🥗", hue: 96,
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Fattoush_mixed-salad.jpg/500px-Fattoush_mixed-salad.jpg",
    groups: [G.mezzeSize] },

  { id: "kibbeh", cat: "mezze", name: "Fried Kibbeh", nameAr: "كبة مقلية", price: 5.50, min: 12,
    desc: "Four bulgur shells filled with spiced lamb, onion and pine nuts.",
    descAr: "أربع حبات برغل محشية بلحمة وبصل وصنوبر.",
    tags: ["popular"], allergens: ["gluten", "nuts"], emoji: "🥟", hue: 28,
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Kibbeh3.jpg/500px-Kibbeh3.jpg",
    groups: [G.spice] },

  { id: "warak", cat: "mezze", name: "Warak Enab", nameAr: "ورق عنب", price: 4.00, min: 8,
    desc: "Vine leaves rolled with rice, tomato and lemon. Served cold.",
    descAr: "ورق عنب محشي بالأرز والبندورة والليمون، يُقدّم بارداً.",
    tags: ["vegan"], allergens: [], emoji: "🍃", hue: 110,
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Etli_yaprak_sarma_in_Turkey.jpg/500px-Etli_yaprak_sarma_in_Turkey.jpg",
    groups: [G.mezzeSize] },

  { id: "zaatar", cat: "saj", name: "Zaatar Manakish", nameAr: "مناقيش زعتر", price: 1.75, min: 8,
    desc: "Saj dough brushed with wild thyme and olive oil, baked to order.",
    descAr: "عجينة صاج بالزعتر البلدي وزيت الزيتون، تُخبز عند الطلب.",
    tags: ["vegan", "breakfast"], allergens: ["gluten", "sesame"], emoji: "🫓", hue: 82,
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Zaatar_Mankousheh.jpg/500px-Zaatar_Mankousheh.jpg",
    groups: [G.sajExtra] },

  { id: "jibneh", cat: "saj", name: "Cheese Manakish", nameAr: "مناقيش جبنة", price: 2.50, min: 8,
    desc: "Stretchy white cheese on saj dough, straight off the dome.",
    descAr: "جبنة بيضاء مطاطة على عجين الصاج، من الصاج مباشرة.",
    tags: ["vegetarian"], allergens: ["gluten", "dairy"], emoji: "🧀", hue: 48,
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Za%27atar_with_cheese_manakish_at_Agasi%2C_Lajpat_Nagar%2C_Delhi_%282025-10-04%29.jpg/500px-Za%27atar_with_cheese_manakish_at_Agasi%2C_Lajpat_Nagar%2C_Delhi_%282025-10-04%29.jpg",
    groups: [G.cheeseType, G.sajExtra] },

  { id: "arayes", cat: "saj", name: "Arayes Lahm", nameAr: "عرايس لحمة", price: 5.00, min: 12,
    desc: "Bread pressed with minced lamb, tomato and chilli, grilled over charcoal.",
    descAr: "خبز محشي بلحمة مفرومة وبندورة وفليفلة، مشوي على الفحم.",
    tags: ["popular"], allergens: ["gluten"], emoji: "🔥", hue: 14,
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Arayes_%283%29.jpg/500px-Arayes_%283%29.jpg",
    groups: [G.spice, G.grillExtra] },

  { id: "mishwi", cat: "grills", name: "Mixed Grill", nameAr: "مشاوي مشكّلة", price: 14.50, min: 22,
    desc: "Shish tawook, kofta and lamb cubes over charcoal, with grilled tomato and onion.",
    descAr: "شيش طاووق وكفتة وقطع لحم على الفحم، مع بندورة وبصل مشوي.",
    tags: ["popular", "sharing"], allergens: [], emoji: "🍢", hue: 18,
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Arabic_MixedGrill.JPG/500px-Arabic_MixedGrill.JPG",
    groups: [G.doneness, G.spice, G.grillSide, G.grillExtra] },

  { id: "tawook", cat: "grills", name: "Shish Tawook", nameAr: "شيش طاووق", price: 9.75, min: 18,
    desc: "Chicken marinated overnight in yoghurt, garlic and lemon. Three skewers.",
    descAr: "دجاج متبّل ليلة كاملة باللبن والثوم والليمون. ثلاثة أسياخ.",
    tags: [], allergens: ["dairy"], emoji: "🍗", hue: 36,
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Tavuk_%C5%9Ei%C5%9F.jpg/500px-Tavuk_%C5%9Ei%C5%9F.jpg",
    groups: [G.spice, G.grillSide, G.grillExtra] },

  { id: "kofta", cat: "grills", name: "Kofta Khashkhash", nameAr: "كفتة خشخاش", price: 9.00, min: 18,
    desc: "Minced lamb with parsley and chilli, grilled and finished in tomato butter.",
    descAr: "لحمة مفرومة مع بقدونس وفليفلة، مشوية ومغطاة بصلصة البندورة.",
    tags: ["spicy"], allergens: ["dairy"], emoji: "🌶️", hue: 8,
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Kafta_shish_kebab_and_grilled_vegetables_on_salad_-_Cambridge%2C_MA.jpg/500px-Kafta_shish_kebab_and_grilled_vegetables_on_salad_-_Cambridge%2C_MA.jpg",
    groups: [G.spice, G.grillSide, G.grillExtra] },

  { id: "riyash", cat: "grills", name: "Lamb Chops", nameAr: "ريش غنم", price: 16.00, min: 25,
    desc: "Four chops from young lamb, salted and grilled plain over charcoal.",
    descAr: "أربع قطع ريش غنم صغير، مملّحة ومشوية على الفحم.",
    tags: ["chef"], allergens: [], emoji: "🍖", hue: 12,
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Liat_Portal_for_Foodie_Disorder_-_Homemade_Lamb_Chops_with_Rice_and_Grilled_Vegetables.jpg/500px-Liat_Portal_for_Foodie_Disorder_-_Homemade_Lamb_Chops_with_Rice_and_Grilled_Vegetables.jpg",
    groups: [G.doneness, G.grillSide, G.grillExtra] },

  { id: "mansaf", cat: "mains", name: "Mansaf", nameAr: "منسف أردني", price: 12.50, min: 30,
    desc: "Lamb slow-cooked in fermented jameed over rice and shrak bread, with almonds.",
    descAr: "لحم غنم مطبوخ على مهل بالجميد، فوق الأرز وخبز الشراك، مع اللوز.",
    tags: ["national", "popular"], allergens: ["dairy", "gluten", "nuts"], emoji: "🍲", hue: 40,
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Mansaf%2C_the_traditional_dish_of_Jordan.jpg/500px-Mansaf%2C_the_traditional_dish_of_Jordan.jpg",
    groups: [G.mansafPortion, G.mansafExtra] },

  { id: "maqluba", cat: "mains", name: "Chicken Maqluba", nameAr: "مقلوبة دجاج", price: 9.50, min: 25,
    desc: "Rice layered with chicken, aubergine and cauliflower, turned out at the table.",
    descAr: "أرز مع دجاج وباذنجان وزهرة، تُقلب أمامك على الطاولة.",
    tags: [], allergens: ["nuts"], emoji: "🍛", hue: 34,
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Makluba.JPG/500px-Makluba.JPG",
    groups: [G.spice] },

  { id: "sayadieh", cat: "mains", name: "Sayadieh", nameAr: "صيادية سمك", price: 13.00, min: 28,
    desc: "Fish fillet on caramelised onion rice with tahini sauce and toasted nuts.",
    descAr: "فيليه سمك على أرز بالبصل المحمّر مع صلصة طحينة ومكسرات.",
    tags: ["chef"], allergens: ["fish", "sesame", "nuts"], emoji: "🐟", hue: 200,
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Fish_Sayadieh.jpg/500px-Fish_Sayadieh.jpg",
    groups: [G.spice] },

  { id: "knafeh", cat: "sweets", name: "Knafeh Nabulsieh", nameAr: "كنافة نابلسية", price: 4.50, min: 12,
    desc: "Shredded pastry over melting cheese, soaked in orange blossom syrup.",
    descAr: "شعيرات كنافة فوق جبنة ذائبة، مسقية بقطر ماء الزهر.",
    tags: ["popular"], allergens: ["gluten", "dairy", "nuts"], emoji: "🍯", hue: 30,
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Qwaider_al_nabulsi_kunafa_al_nama_%2811389641075%29.jpg/500px-Qwaider_al_nabulsi_kunafa_al_nama_%2811389641075%29.jpg",
    groups: [G.knafehSize] },

  { id: "baklava", cat: "sweets", name: "Baklava Plate", nameAr: "بقلاوة", price: 3.75, min: 4,
    desc: "Six assorted pieces with pistachio, walnut and cashew.",
    descAr: "ست قطع مشكّلة بالفستق والجوز والكاجو.",
    tags: ["vegetarian"], allergens: ["gluten", "nuts", "dairy"], emoji: "🥮", hue: 52,
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Baklava_kymi_greece.jpg/500px-Baklava_kymi_greece.jpg",
    groups: [] },

  { id: "limonana", cat: "drinks", name: "Mint Lemonade", nameAr: "ليمون بالنعناع", price: 2.75, min: 4,
    desc: "Lemon blended with fresh mint and crushed ice.",
    descAr: "ليمون مخفوق مع نعناع طازج وثلج مجروش.",
    tags: ["popular"], allergens: [], emoji: "🍋", hue: 76,
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Mint_lemonade.jpg/500px-Mint_lemonade.jpg",
    groups: [G.sugar, G.ice] },

  { id: "qahwa", cat: "drinks", name: "Arabic Coffee", nameAr: "قهوة عربية", price: 1.50, min: 5,
    desc: "Light roast with cardamom, poured from the dallah.",
    descAr: "قهوة فاتحة بالهيل، تُصبّ من الدلّة.",
    tags: [], allergens: [], emoji: "☕", hue: 26,
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/A_dallah_a_traditional_Arabic_coffee_pot_with_cups_and_coffee_beans.jpg/500px-A_dallah_a_traditional_Arabic_coffee_pot_with_cups_and_coffee_beans.jpg",
    groups: [G.sugar] },

  { id: "orange", cat: "drinks", name: "Fresh Orange", nameAr: "عصير برتقال", price: 3.00, min: 4,
    desc: "Pressed to order. Nothing added.",
    descAr: "يُعصر عند الطلب. بدون أي إضافات.",
    tags: ["vegan"], allergens: [], emoji: "🍊", hue: 30,
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Glass_of_Fresh_Orange_Juice.jpg/500px-Glass_of_Fresh_Orange_Juice.jpg",
    groups: [G.ice] },

  { id: "ayran", cat: "drinks", name: "Ayran", nameAr: "عيران", price: 1.25, min: 2,
    desc: "Salted yoghurt drink, shaken cold.",
    descAr: "لبن مملّح مخفوق بارد.",
    tags: [], allergens: ["dairy"], emoji: "🥛", hue: 190,
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Ayran_%28large_glass%29.jpg/500px-Ayran_%28large_glass%29.jpg",
    groups: [G.ice] },
];

const UNAVAILABLE = ["sayadieh"]; // 86'd by the kitchen today

/* ------------------------------ strings ------------------------------ */

const T = {
  en: {
    dir: "ltr", table: "Table", seats: "seats", open: "Kitchen open",
    callWaiter: "Call waiter", requestBill: "Request bill",
    askChef: "Ask the chef", chefSub: "Allergies, swaps, portion questions",
    yourOrder: "Your order", empty: "Nothing here yet",
    emptyHint: "Pick something from the menu and it lands here.",
    subtotal: "Subtotal", service: "Service", tax: "Sales tax", total: "Total",
    send: "Send to kitchen", clear: "Clear cart", add: "Add to order",
    qty: "Quantity", notes: "Notes for the kitchen",
    notesPh: "No onions, sauce on the side, split the plate…",
    close: "Close", each: "each", min: "min", sold: "Sold out today",
    edit: "Edit", save: "Save changes", remove: "Remove", updated: "Order updated",
    inCart: "in your order", editing: "Editing an item already in your order",
    required: "Choose one", optional: "Optional",
    placed: "Sent to the kitchen", editWindow: "You can still change this order",
    allGood: "All good?",
    editOrder: "Edit order", cancelOrder: "Cancel order", locked: "Kitchen has started cooking",
    lockedHint: "Ask a waiter if you need a change now.",
    round: "Round", addMore: "Send additions", viewBill: "View bill", back: "Back to menu",
    bill: "Your bill", billFor: "Table 12 · Leaf", tip: "Tip",
    payNow: "Pay now", payMethod: "How would you like to pay?",
    processing: "Processing payment…", paid: "Paid", thanks: "Thank you",
    thanksSub: "Your receipt is below. Show it to staff on the way out.",
    invoice: "Invoice", newOrder: "Start a new order",
    status: { received: "Received", preparing: "Preparing", ready: "Ready", served: "Served" },
    chatPh: "I'm allergic to sesame — what can I eat?",
    chatIntro: "I'm the kitchen assistant at Leaf. Ask me about allergens, spice levels, or whether the chef can make a change to a dish.",
    suggested: "Suggested for you", thinking: "Checking with the kitchen…",
    calling: "A waiter is on the way", billCalled: "A waiter will bring the card machine",
    cashNote: "Noted — the waiter will pass by to collect payment",
    cartCleared: "Cart cleared", cancelled: "Order cancelled", confirmed: "Order confirmed with the kitchen",
    vegan: "Vegan", vegetarian: "Vegetarian", spicy: "Spicy", popular: "Most ordered",
    chef: "Chef's pick", national: "National dish", sharing: "For sharing", breakfast: "Breakfast",
    contains: "Contains", perItem: "Prep",
  },
  ar: {
    dir: "rtl", table: "طاولة", seats: "مقاعد", open: "المطبخ يعمل",
    callWaiter: "نادي النادل", requestBill: "اطلب الفاتورة",
    askChef: "اسأل الشيف", chefSub: "الحساسية، التعديلات، أسئلة الكميات",
    yourOrder: "طلبك", empty: "ما في شي بعد",
    emptyHint: "اختر من المنيو ورح يظهر هون.",
    subtotal: "المجموع", service: "الخدمة", tax: "ضريبة المبيعات", total: "الإجمالي",
    send: "أرسل للمطبخ", clear: "أفرغ السلة", add: "أضف للطلب",
    qty: "الكمية", notes: "ملاحظات للمطبخ",
    notesPh: "بدون بصل، الصلصة على جنب، قسّم الصحن…",
    close: "إغلاق", each: "للحبة", min: "دقيقة", sold: "غير متوفر اليوم",
    edit: "تعديل", save: "احفظ التعديل", remove: "احذف", updated: "تم تحديث الطلب",
    inCart: "في طلبك", editing: "تعديل صنف موجود في طلبك",
    required: "اختر واحداً", optional: "اختياري",
    placed: "وصل للمطبخ", editWindow: "لسا فيك تعدّل الطلب",
    allGood: "كلّه تمام؟",
    editOrder: "عدّل الطلب", cancelOrder: "ألغِ الطلب", locked: "المطبخ بدأ التحضير",
    lockedHint: "احكِ مع النادل إذا بدك تعديل هلأ.",
    round: "دفعة", addMore: "أرسل الإضافات", viewBill: "اعرض الفاتورة", back: "رجوع للمنيو",
    bill: "فاتورتك", billFor: "طاولة ١٢ · ورقة", tip: "إكرامية",
    payNow: "ادفع الآن", payMethod: "كيف بتحب تدفع؟",
    processing: "جاري تنفيذ الدفع…", paid: "مدفوعة", thanks: "شكراً لك",
    thanksSub: "هاي فاتورتك. اعرضها على الموظف عند الخروج.",
    invoice: "فاتورة", newOrder: "ابدأ طلباً جديداً",
    status: { received: "تم الاستلام", preparing: "قيد التحضير", ready: "جاهز", served: "تم التقديم" },
    chatPh: "عندي حساسية من السمسم — شو بقدر آكل؟",
    chatIntro: "أنا مساعد المطبخ في ورقة. اسألني عن مسببات الحساسية، درجة الحرارة، أو إذا كان الشيف يقدر يعدّل صحن معيّن.",
    suggested: "مقترح إلك", thinking: "بستشير المطبخ…",
    calling: "النادل بالطريق", billCalled: "النادل رح يجيب جهاز الدفع",
    cashNote: "تمام — النادل رح يمرّ عليك لتحصيل الدفع",
    cartCleared: "تم إفراغ السلة", cancelled: "تم إلغاء الطلب", confirmed: "تم تأكيد الطلب مع المطبخ",
    vegan: "نباتي صرف", vegetarian: "نباتي", spicy: "حار", popular: "الأكثر طلباً",
    chef: "اختيار الشيف", national: "الطبق الوطني", sharing: "للمشاركة", breakfast: "فطور",
    contains: "يحتوي", perItem: "التحضير",
  },
};

/* ------------------------------ helpers ------------------------------ */

const jd = (n) => n.toFixed(2);
const uid = () => Math.random().toString(36).slice(2, 10);

function selEqual(a, b) {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for (const k of keys) {
    const av = (a || {})[k], bv = (b || {})[k];
    if (Array.isArray(av) || Array.isArray(bv)) {
      const as = [...(av || [])].sort();
      const bs = [...(bv || [])].sort();
      if (as.length !== bs.length || as.some((v, i) => v !== bs[i])) return false;
    } else if (av !== bv) return false;
  }
  return true;
}

function linePrice(item, sel) {
  let p = item.price;
  item.groups.forEach((g) => {
    const chosen = sel[g.id];
    if (!chosen) return;
    const ids = Array.isArray(chosen) ? chosen : [chosen];
    ids.forEach((oid) => {
      const o = g.options.find((x) => x.id === oid);
      if (o) p += o.price;
    });
  });
  return p;
}

function defaultSel(item) {
  const s = {};
  item.groups.forEach((g) => {
    if (g.type === "single") s[g.id] = g.options[0].id;
    else s[g.id] = [];
  });
  return s;
}

/* single-choice groups always have a valid default (first option); a required
 * multi-choice group has no sensible default, so it forces the customize sheet */
function needsCustomization(item) {
  return item.groups.some((g) => g.required && g.type === "multi");
}

function selLabel(item, sel, lang) {
  const parts = [];
  item.groups.forEach((g) => {
    const chosen = sel[g.id];
    if (!chosen) return;
    const ids = Array.isArray(chosen) ? chosen : [chosen];
    ids.forEach((oid) => {
      const o = g.options.find((x) => x.id === oid);
      if (o) parts.push(lang === "ar" ? o.nameAr : o.name);
    });
  });
  return parts;
}

/* ----------------------------- ornaments ----------------------------- */

function Thyme({ size = 17, color = "currentColor", style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
      <path
        fill={color}
        d="M11.11 22L11.64 21.73L12.18 21.45L12.72 21.18L13.26 20.89L13.8 20.59L14.32 20.26L14.83 19.91L15.32 19.51L15.78 19.05L16.2 18.52L16.56 17.92L16.83 17.24L17 16.5L17.06 15.73L16.99 14.96L16.83 14.22L16.59 13.51L16.29 12.86L15.95 12.25L15.58 11.69L15.19 11.17L14.8 10.68L14.4 10.23L14.03 9.82L13.67 9.44L13.34 9.1L13.05 8.81L12.81 8.55L12.6 8.35L12.44 8.2L12.3 8.11L12.18 8.05L12.06 8.01L11.94 7.97L11.82 7.87L11.71 7.71L11.65 7.46L11.63 7.14L11.67 6.75L11.78 6.31L11.93 5.83L12.12 5.32L12.34 4.78L12.58 4.23L12.82 3.68L13.06 3.11L13.27 2.55L13.45 2L12.95 2.28L12.44 2.55L11.91 2.82L11.37 3.1L10.83 3.38L10.29 3.68L9.76 4.01L9.24 4.36L8.73 4.75L8.25 5.2L7.81 5.71L7.41 6.29L7.09 6.96L6.87 7.7L6.76 8.49L6.78 9.28L6.9 10.06L7.12 10.8L7.41 11.48L7.75 12.11L8.13 12.69L8.53 13.23L8.93 13.73L9.35 14.18L9.75 14.6L10.14 14.99L10.5 15.33L10.83 15.64L11.12 15.91L11.37 16.14L11.58 16.32L11.76 16.45L11.91 16.54L12.05 16.6L12.19 16.66L12.33 16.76L12.46 16.91L12.56 17.14L12.61 17.45L12.6 17.83L12.53 18.26L12.41 18.74L12.24 19.24L12.04 19.78L11.81 20.32L11.57 20.88L11.33 21.44Z"
      />
    </svg>
  );
}

function Dish({ item, className }) {
  const [failed, setFailed] = useState(false);
  const fb = (
    <div className={"dish-fb " + (className || "")} style={{ "--h": item.hue }}>
      <span className="dish-emoji">{item.emoji}</span>
    </div>
  );
  if (failed) return fb;
  return (
    <div className={"dish-wrap " + (className || "")} style={{ "--h": item.hue }}>
      <span className="dish-emoji dish-under">{item.emoji}</span>
      <img src={item.photo} alt="" loading="lazy" onError={() => setFailed(true)} />
    </div>
  );
}

/* =============================== APP ================================= */

export default function App() {
  const [lang, setLang] = useState("en");
  const t = T[lang];
  const isAr = lang === "ar";

  const [cart, setCart] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [sheet, setSheet] = useState(null);       // item being customised
  const [view, setView] = useState("menu");       // menu | bill | paid
  const [chatOpen, setChatOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [tip, setTip] = useState(0);
  const [payMethod, setPayMethod] = useState(null);
  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [activeCat, setActiveCat] = useState("mezze");
  const [mobileCart, setMobileCart] = useState(false);

  const menuRef = useRef(null);
  const catRefs = useRef({});

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const i = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(i);
  }, [toast]);

  /* lock the page behind the mobile cart sheet. html (not body) carries the
     lock because our CSS sets overflow-x on html, which stops body's overflow
     from propagating to the viewport */
  useEffect(() => {
    if (!mobileCart) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => { root.style.overflow = prev; };
  }, [mobileCart]);

  /* The phone's back gesture should peel off whatever is open rather than
     leaving the site. Every open layer owns one history entry: opening pushes
     one, back consumes one, and closing from the UI rewinds the one it added
     (skipPopRef swallows the popstate that rewind triggers). */
  const overlayDepth =
    (chatOpen ? 1 : 0) + (sheet ? 1 : 0) + (mobileCart ? 1 : 0) + (view === "bill" ? 1 : 0);
  const depthRef = useRef(0);
  const skipPopRef = useRef(0);

  useEffect(() => {
    const onPop = () => {
      if (skipPopRef.current > 0) { skipPopRef.current -= 1; return; }
      if (depthRef.current === 0) return;      // nothing of ours open: let the browser leave
      depthRef.current -= 1;
      if (chatOpen) setChatOpen(false);        // close the topmost layer first
      else if (sheet) setSheet(null);
      else if (mobileCart) setMobileCart(false);
      else if (view === "bill") setView("menu");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [chatOpen, sheet, mobileCart, view]);

  useEffect(() => {
    const prev = depthRef.current;
    if (overlayDepth > prev) {
      for (let i = prev; i < overlayDepth; i++) window.history.pushState({ leafLayer: i + 1 }, "");
      depthRef.current = overlayDepth;
    } else if (overlayDepth < prev) {
      depthRef.current = overlayDepth;
      skipPopRef.current += 1;
      window.history.go(overlayDepth - prev);
    }
  }, [overlayDepth]);

  /* scroll spy */
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const onScroll = () => {
      let current = CATEGORIES[0].id;
      CATEGORIES.forEach((c) => {
        const n = catRefs.current[c.id];
        if (n && n.getBoundingClientRect().top < 210) current = c.id;
      });
      setActiveCat(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [view]);

  /* ------------------------------ cart ops ------------------------------ */

  const addToCart = (item, sel, qty, note) => {
    setCart((c) => {
      const idx = c.findIndex(
        (l) => l.itemId === item.id && (l.note || "") === (note || "") && selEqual(l.sel, sel)
      );
      if (idx >= 0) {
        const next = [...c];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [...c, { lineId: uid(), itemId: item.id, sel, qty, note, unit: linePrice(item, sel) }];
    });
    setToast({ kind: "ok", msg: (isAr ? item.nameAr : item.name) + " ✓" });
  };

  const setQty = (lineId, q) =>
    setCart((c) =>
      q <= 0 ? c.filter((l) => l.lineId !== lineId) : c.map((l) => (l.lineId === lineId ? { ...l, qty: q } : l))
    );

  const cartTotal = cart.reduce((s, l) => s + l.unit * l.qty, 0);
  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  /* the phone order bar only exists once something is ordered; the chef button
     tucks into the corner when it isn't there and lifts clear when it is */
  const showMobar = view === "menu" && (cart.length > 0 || rounds.length > 0);

  /* how many of each dish are sitting in the cart right now */
  const counts = useMemo(() => {
    const c = {};
    cart.forEach((l) => { c[l.itemId] = (c[l.itemId] || 0) + l.qty; });
    return c;
  }, [cart]);

  const editLine = (lineId) => {
    const line = cart.find((l) => l.lineId === lineId);
    if (!line) return;
    setMobileCart(false);
    setSheet({ item: MENU.find((m) => m.id === line.itemId), line });
  };

  const saveLine = (lineId, item, sel, qty, note) => {
    setCart((c) =>
      c.map((l) =>
        l.lineId === lineId ? { ...l, sel, qty, note, unit: linePrice(item, sel) } : l
      )
    );
    setToast({ kind: "ok", msg: t.updated });
  };

  const submit = () => {
    if (!cart.length) return;
    setRounds((r) => [...r, { id: uid(), n: r.length + 1, lines: cart, at: Date.now() }]);
    setCart([]);
    setMobileCart(false);
    setToast({ kind: "ok", msg: t.placed });
  };

  const lastRound = rounds[rounds.length - 1];
  const editLeft = lastRound ? Math.max(0, EDIT_WINDOW_SEC - Math.floor((now - lastRound.at) / 1000)) : 0;
  const canEdit = editLeft > 0;

  const editLast = () => {
    if (!lastRound) return;
    setCart((c) => [...lastRound.lines, ...c]);
    setRounds((r) => r.slice(0, -1));
    setToast({ kind: "warn", msg: t.editOrder });
  };
  const cancelLast = () => {
    if (!lastRound) return;
    setRounds((r) => r.slice(0, -1));
    setToast({ kind: "warn", msg: t.cancelled });
  };
  const confirmLast = () => {
    if (!lastRound) return;
    setRounds((r) =>
      r.map((round, i) => (i === r.length - 1 ? { ...round, at: Date.now() - EDIT_WINDOW_SEC * 1000 } : round))
    );
    setToast({ kind: "ok", msg: t.confirmed });
  };

  const roundStatus = (r) => {
    const age = (now - r.at) / 1000;
    if (age < EDIT_WINDOW_SEC) return "received";
    if (age < EDIT_WINDOW_SEC + 60) return "preparing";
    if (age < EDIT_WINDOW_SEC + 100) return "ready";
    return "served";
  };

  /* ------------------------------- bill -------------------------------- */

  const allLines = rounds.flatMap((r) => r.lines);
  const subtotal = allLines.reduce((s, l) => s + l.unit * l.qty, 0);
  const service = subtotal * SERVICE_RATE;
  const tax = (subtotal + service) * TAX_RATE;
  const tipAmt = subtotal * tip;
  const grand = subtotal + service + tax + tipAmt;

  const pay = () => {
    if (!payMethod) return;
    if (payMethod === "cash") {
      setToast({ kind: "ok", msg: t.cashNote });
      return;
    }
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      setReceipt({
        no: "BAS-" + new Date().getFullYear() + "-" + Math.floor(100000 + Math.random() * 899999),
        at: new Date(),
        method: payMethod,
        total: grand,
      });
      setView("paid");
    }, 2200);
  };

  const reset = () => {
    setCart([]); setRounds([]); setReceipt(null); setPayMethod(null);
    setTip(0); setView("menu");
  };

  const goCat = (id) => {
    const n = catRefs.current[id];
    if (n) window.scrollTo({ top: n.offsetTop - 150, behavior: "smooth" });
  };

  /* ------------------------------- render ------------------------------- */

  return (
    <div className="app" dir={t.dir} lang={lang}>
      <style>{CSS}</style>

      <Header
        t={t} lang={lang} setLang={setLang} isAr={isAr}
        onCall={() => setToast({ kind: "ok", msg: t.calling })}
        onBill={() => { setView("bill"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        showBill={rounds.length > 0 && view === "menu"}
      />

      {view === "menu" && (
        <nav className="catbar" aria-label="Menu sections">
          <div className="catbar-in">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                className={"chip" + (activeCat === c.id ? " chip-on" : "")}
                onClick={() => goCat(c.id)}
              >
                {isAr ? c.nameAr : c.name}
              </button>
            ))}
          </div>
        </nav>
      )}

      <main className="shell">
        {view === "menu" && (
          <>
            <section className="menu" ref={menuRef}>
              {CATEGORIES.map((c) => (
                <div key={c.id} ref={(n) => (catRefs.current[c.id] = n)} className="cat">
                  <div className="cat-head">
                    <Thyme size={11} color="var(--sumac)" />
                    <h2>{isAr ? c.nameAr : c.name}</h2>
                    <span className="rule" />
                    <span className="cat-alt">{isAr ? c.name : c.nameAr}</span>
                  </div>
                  <div className="grid">
                    {MENU.filter((m) => m.cat === c.id).map((m) => (
                      <MenuCard
                        key={m.id} item={m} t={t} isAr={isAr}
                        count={counts[m.id] || 0}
                        out={UNAVAILABLE.includes(m.id)}
                        onPick={() => setSheet({ item: m })}
                        onQuickAdd={() => {
                          if (needsCustomization(m)) setSheet({ item: m });
                          else addToCart(m, defaultSel(m), 1, "");
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <footer className="foot">
                <Thyme size={10} color="var(--brass)" />
                <p>
                  {isAr
                    ? "الأسعار بالدينار الأردني وتشمل الخدمة والضريبة عند الدفع. المطبخ يتعامل مع المكسرات والسمسم."
                    : "Prices in Jordanian dinar. Service and tax are added at checkout. The kitchen handles nuts and sesame."}
                </p>
              </footer>
            </section>

            <aside
              className={"cart" + (mobileCart ? " cart-open" : "")}
              onClick={(e) => { if (e.target === e.currentTarget) setMobileCart(false); }}
            >
              <CartPanel
                t={t} isAr={isAr} cart={cart} setQty={setQty} onEditLine={editLine} total={cartTotal}
                onClear={() => { setCart([]); setToast({ kind: "warn", msg: t.cartCleared }); }}
                onSubmit={submit}
                rounds={rounds} roundStatus={roundStatus}
                canEdit={canEdit} editLeft={editLeft}
                onEdit={editLast} onCancel={cancelLast} onConfirm={confirmLast}
                onBill={() => { setView("bill"); setMobileCart(false); window.scrollTo({ top: 0 }); }}
                onClose={() => setMobileCart(false)}
              />
            </aside>
          </>
        )}

        {view === "bill" && (
          <Bill
            t={t} isAr={isAr} rounds={rounds}
            subtotal={subtotal} service={service} tax={tax} tipAmt={tipAmt} grand={grand}
            tip={tip} setTip={setTip}
            payMethod={payMethod} setPayMethod={setPayMethod}
            paying={paying} onPay={pay} onBack={() => setView("menu")}
          />
        )}

        {view === "paid" && (
          <Receipt t={t} isAr={isAr} receipt={receipt} rounds={rounds}
            subtotal={subtotal} service={service} tax={tax} tipAmt={tipAmt} grand={grand}
            onReset={reset} />
        )}
      </main>

      {/* mobile cart bar */}
      {showMobar && (
        <button className="mobar" onClick={() => setMobileCart(true)}>
          {cartCount > 0
            ? <span className="mobar-n">{cartCount}</span>
            : <Thyme size={15} color="var(--paper)" />}
          <span>{t.yourOrder}</span>
          <span className="mobar-p">
            {cartCount > 0
              ? `${jd(cartTotal)} JD`
              : lastRound && t.status[roundStatus(lastRound)]}
          </span>
        </button>
      )}

      <button
        className={"chef-fab" + (showMobar ? " chef-fab-raised" : "")}
        onClick={() => setChatOpen(true)}
        aria-label={t.askChef}
      >
        <Thyme size={13} color="var(--paper)" />
        <span>{t.askChef}</span>
      </button>

      {sheet && (
        <ItemSheet
          item={sheet.item} line={sheet.line} t={t} isAr={isAr}
          onClose={() => setSheet(null)}
          onRemove={() => { setQty(sheet.line.lineId, 0); setSheet(null); }}
          onAdd={(sel, qty, note) => {
            if (sheet.line) saveLine(sheet.line.lineId, sheet.item, sel, qty, note);
            else addToCart(sheet.item, sel, qty, note);
            setSheet(null);
          }}
        />
      )}

      {chatOpen && (
        <ChefChat
          t={t} isAr={isAr} lang={lang}
          onClose={() => setChatOpen(false)}
          onPick={(id) => { const m = MENU.find((x) => x.id === id); if (m) { setChatOpen(false); setSheet({ item: m }); } }}
        />
      )}

      {toast && (
        <div className={"toast toast-" + toast.kind + (showMobar ? " toast-raised" : "")}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- header ------------------------------- */

function Header({ t, lang, setLang, isAr, onCall, onBill, showBill }) {
  return (
    <header className="hdr">
      <svg className="hdr-leaf hdr-leaf-start" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M11.11 22L11.64 21.73L12.18 21.45L12.72 21.18L13.26 20.89L13.8 20.59L14.32 20.26L14.83 19.91L15.32 19.51L15.78 19.05L16.2 18.52L16.56 17.92L16.83 17.24L17 16.5L17.06 15.73L16.99 14.96L16.83 14.22L16.59 13.51L16.29 12.86L15.95 12.25L15.58 11.69L15.19 11.17L14.8 10.68L14.4 10.23L14.03 9.82L13.67 9.44L13.34 9.1L13.05 8.81L12.81 8.55L12.6 8.35L12.44 8.2L12.3 8.11L12.06 8.01L11.94 7.97L11.82 7.87L11.71 7.71L11.65 7.46L11.63 7.14L11.67 6.75L11.78 6.31L11.93 5.83L12.12 5.32L12.34 4.78L12.58 4.23L12.82 3.68L13.06 3.11L13.27 2.55L13.45 2L12.95 2.28L12.44 2.55L11.91 2.82L11.37 3.1L10.83 3.38L10.29 3.68L9.76 4.01L9.24 4.36L8.73 4.75L8.25 5.2L7.81 5.71L7.41 6.29L7.09 6.96L6.87 7.7L6.76 8.49L6.78 9.28L6.9 10.06L7.12 10.8L7.41 11.48L7.75 12.11L8.13 12.69L8.53 13.23L8.93 13.73L9.35 14.18L9.75 14.6L10.14 14.99L10.5 15.33L10.83 15.64L11.12 15.91L11.37 16.14L11.58 16.32L11.76 16.45L11.91 16.54L12.05 16.6L12.19 16.66L12.33 16.76L12.46 16.91L12.56 17.14L12.61 17.45L12.6 17.83L12.53 18.26L12.41 18.74L12.24 19.24L12.04 19.78L11.81 20.32L11.57 20.88L11.33 21.44Z" />
      </svg>
      <svg className="hdr-leaf hdr-leaf-end" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M11.11 22L11.64 21.73L12.18 21.45L12.72 21.18L13.26 20.89L13.8 20.59L14.32 20.26L14.83 19.91L15.32 19.51L15.78 19.05L16.2 18.52L16.56 17.92L16.83 17.24L17 16.5L17.06 15.73L16.99 14.96L16.83 14.22L16.59 13.51L16.29 12.86L15.95 12.25L15.58 11.69L15.19 11.17L14.8 10.68L14.4 10.23L14.03 9.82L13.67 9.44L13.34 9.1L13.05 8.81L12.81 8.55L12.6 8.35L12.44 8.2L12.3 8.11L12.06 8.01L11.94 7.97L11.82 7.87L11.71 7.71L11.65 7.46L11.63 7.14L11.67 6.75L11.78 6.31L11.93 5.83L12.12 5.32L12.34 4.78L12.58 4.23L12.82 3.68L13.06 3.11L13.27 2.55L13.45 2L12.95 2.28L12.44 2.55L11.91 2.82L11.37 3.1L10.83 3.38L10.29 3.68L9.76 4.01L9.24 4.36L8.73 4.75L8.25 5.2L7.81 5.71L7.41 6.29L7.09 6.96L6.87 7.7L6.76 8.49L6.78 9.28L6.9 10.06L7.12 10.8L7.41 11.48L7.75 12.11L8.13 12.69L8.53 13.23L8.93 13.73L9.35 14.18L9.75 14.6L10.14 14.99L10.5 15.33L10.83 15.64L11.12 15.91L11.37 16.14L11.58 16.32L11.76 16.45L11.91 16.54L12.05 16.6L12.19 16.66L12.33 16.76L12.46 16.91L12.56 17.14L12.61 17.45L12.6 17.83L12.53 18.26L12.41 18.74L12.24 19.24L12.04 19.78L11.81 20.32L11.57 20.88L11.33 21.44Z" />
      </svg>
      <div className="hdr-in">
        <div className="brand">
          <div className="mark"><Thyme size={26} color="#fff" /></div>
          <div>
            <h1>{isAr ? "ورقة" : "Leaf"}</h1>
          </div>
        </div>

        <div className="hdr-right">
          <div className="table-tag">
            <span className="dot" />
            <span>{t.table} <b>12</b></span>
          </div>
          <button className="ghost" onClick={onCall}>{t.callWaiter}</button>
          {showBill && <button className="ghost" onClick={onBill}>{t.requestBill}</button>}
          <button className="lang" onClick={() => setLang(lang === "en" ? "ar" : "en")}>
            {lang === "en" ? "عربي" : "EN"}
          </button>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------ menu card ----------------------------- */

function MenuCard({ item, t, isAr, out, onPick, onQuickAdd, count = 0 }) {
  return (
    <article
      className={"card" + (out ? " card-out" : "") + (count ? " card-in" : "") + (out ? "" : " card-clickable")}
      onClick={out ? undefined : onPick}
      role={out ? undefined : "button"}
      tabIndex={out ? undefined : 0}
      onKeyDown={out ? undefined : (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(); } }}
    >
      <div className="card-imgwrap">
        <Dish item={item} className="card-img" />
        {count > 0 && (
          <span className="incart" title={t.inCart}>
            <b>{count}</b> {t.inCart}
          </span>
        )}
      </div>
      <div className="card-body">
        <div className="card-top">
          <h3>{isAr ? item.nameAr : item.name}</h3>
          <span className="card-alt">{isAr ? item.name : item.nameAr}</span>
        </div>
        <p className="card-desc">{isAr ? item.descAr : item.desc}</p>
        <div className="tags">
          {item.tags.map((tg) => (
            <span key={tg} className={"tag tag-" + tg}>{t[tg] || tg}</span>
          ))}
          <span className="tag tag-time">{item.min} {t.min}</span>
        </div>
        <div className="card-foot">
          <span className="price">{jd(item.price)} <i>JD</i></span>
          {out ? (
            <span className="soldout">{t.sold}</span>
          ) : (
            <button
              className={"addbtn" + (count ? " addbtn-on" : "")}
              onClick={(e) => { e.stopPropagation(); onQuickAdd(); }}
            >
              {count > 0 ? <span className="addbtn-n">{count}</span> : "+"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/* ---------------------------- item sheet ------------------------------ */

function ItemSheet({ item, line, t, isAr, onClose, onAdd, onRemove }) {
  const editing = Boolean(line);
  const [sel, setSel] = useState(() => (line ? { ...line.sel } : defaultSel(item)));
  const [qty, setQty] = useState(line ? line.qty : 1);
  const [note, setNote] = useState(line ? line.note || "" : "");
  const unit = linePrice(item, sel);

  const toggle = (g, oid) => {
    setSel((s) => {
      if (g.type === "single") return { ...s, [g.id]: oid };
      const cur = s[g.id] || [];
      return { ...s, [g.id]: cur.includes(oid) ? cur.filter((x) => x !== oid) : [...cur, oid] };
    });
  };

  return (
    <div className="ovl" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-hero">
          <Dish item={item} className="sheet-img" />
          <button className="sheet-x" onClick={onClose} aria-label={t.close}>×</button>
        </div>

        <div className="sheet-body">
          {editing && <div className="editing-note">{t.editing}</div>}
          <h3>{isAr ? item.nameAr : item.name}</h3>
          <span className="card-alt">{isAr ? item.name : item.nameAr}</span>
          <p className="sheet-desc">{isAr ? item.descAr : item.desc}</p>

          <div className="sheet-meta">
            <span>{t.perItem} · {item.min} {t.min}</span>
            {item.allergens.length > 0 && (
              <span className="allerg">{t.contains}: {item.allergens.join(", ")}</span>
            )}
          </div>

          {item.groups.map((g) => (
            <div key={g.id} className="group">
              <div className="group-head">
                <h4>{isAr ? g.nameAr : g.name}</h4>
                <span className={"req" + (g.required ? " req-on" : "")}>
                  {g.required ? t.required : t.optional}
                </span>
              </div>
              <div className="opts">
                {g.options.map((o) => {
                  const on = g.type === "single"
                    ? sel[g.id] === o.id
                    : (sel[g.id] || []).includes(o.id);
                  return (
                    <button
                      key={o.id}
                      className={"opt" + (on ? " opt-on" : "")}
                      onClick={() => toggle(g, o.id)}
                    >
                      <span className={g.type === "single" ? "radio" : "check"} />
                      <span className="opt-name">{isAr ? o.nameAr : o.name}</span>
                      {o.price > 0 && <span className="opt-p">+{jd(o.price)}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="group">
            <div className="group-head">
              <h4>{t.notes}</h4>
              <span className="req">{t.optional}</span>
            </div>
            <textarea
              className="notes" rows={2} value={note} placeholder={t.notesPh}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <div className="sheet-foot">
          <div className="stepper">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span>{qty}</span>
            <button onClick={() => setQty((q) => Math.min(20, q + 1))}>+</button>
          </div>
          {editing && (
            <button className="ghost removebtn" onClick={onRemove}>{t.remove}</button>
          )}
          <button className="primary grow" onClick={() => onAdd(sel, qty, note.trim())}>
            <span>{editing ? t.save : t.add}</span>
            <span className="btn-p">{jd(unit * qty)} JD</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- cart panel ----------------------------- */

function CartPanel({
  t, isAr, cart, setQty, onEditLine, total, onClear, onSubmit,
  rounds, roundStatus, canEdit, editLeft, onEdit, onCancel, onConfirm, onBill, onClose,
}) {
  const STEPS = ["received", "preparing", "ready", "served"];
  return (
    <div className="cart-in">
      <span className="sheet-grab" aria-hidden="true" />
      <div className="cart-head">
        <h2>{t.yourOrder}</h2>
        <button className="cart-x" onClick={onClose} aria-label={t.close}>×</button>
      </div>

      <div className="cart-scroll">
        {rounds.map((r) => {
          const st = roundStatus(r);
          const si = STEPS.indexOf(st);
          const isLast = r === rounds[rounds.length - 1];
          return (
            <div key={r.id} className="round">
              <div className="round-head">
                <span className="round-n">{t.round} {r.n}</span>
                <span className={"pill pill-" + st}>{t.status[st]}</span>
              </div>

              <div className="track">
                {STEPS.map((s, i) => (
                  <div key={s} className={"node" + (i <= si ? " node-on" : "")}>
                    <Thyme size={9} color={i <= si ? "var(--sumac)" : "var(--line-solid)"} />
                    <span>{t.status[s]}</span>
                  </div>
                ))}
              </div>

              {r.lines.map((l) => {
                const it = MENU.find((m) => m.id === l.itemId);
                return (
                  <div key={l.lineId} className="line line-locked">
                    <span className="line-q">{l.qty}×</span>
                    <div className="line-mid">
                      <span className="line-n">{isAr ? it.nameAr : it.name}</span>
                      <span className="line-o">{selLabel(it, l.sel, isAr ? "ar" : "en").join(" · ")}</span>
                      {l.note && <span className="line-note">“{l.note}”</span>}
                    </div>
                    <span className="line-p">{jd(l.unit * l.qty)}</span>
                  </div>
                );
              })}

              {isLast && canEdit && (
                <div className="editwin">
                  <div className="editwin-top">
                    <span>{t.editWindow}</span>
                    <span className="count">{editLeft}s</span>
                  </div>
                  <div className="bar"><i style={{ width: (editLeft / EDIT_WINDOW_SEC) * 100 + "%" }} /></div>
                  <div className="editwin-btns">
                    <button className="mini" onClick={onEdit}>{t.editOrder}</button>
                    <button className="mini mini-danger" onClick={onCancel}>{t.cancelOrder}</button>
                  </div>
                  <div className="editwin-skip">
                    <button className="editwin-pay" onClick={onConfirm}>{t.allGood}</button>
                  </div>
                </div>
              )}
              {isLast && !canEdit && (
                <div className="lockedbox">
                  <b>{t.locked}</b>
                  <span>{t.lockedHint}</span>
                </div>
              )}
            </div>
          );
        })}

        {cart.length === 0 && rounds.length === 0 && (
          <div className="empty">
            <Thyme size={20} color="var(--line-solid)" />
            <b>{t.empty}</b>
            <span>{t.emptyHint}</span>
          </div>
        )}

        {cart.map((l) => {
          const it = MENU.find((m) => m.id === l.itemId);
          return (
            <div key={l.lineId} className="line">
              <div className="line-stp">
                <button onClick={() => setQty(l.lineId, l.qty - 1)}>−</button>
                <span>{l.qty}</span>
                <button onClick={() => setQty(l.lineId, l.qty + 1)}>+</button>
              </div>
              <div className="line-mid">
                <span className="line-n">{isAr ? it.nameAr : it.name}</span>
                <span className="line-o">{selLabel(it, l.sel, isAr ? "ar" : "en").join(" · ")}</span>
                {l.note && <span className="line-note">“{l.note}”</span>}
                <div className="line-actions">
                  <button className="line-edit" onClick={() => onEditLine(l.lineId)}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                    </svg>
                    {t.edit}
                  </button>
                  <button className="line-edit line-delete" onClick={() => setQty(l.lineId, 0)} aria-label={t.remove}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" /><path d="M14 11v6" />
                    </svg>
                    {t.remove}
                  </button>
                </div>
              </div>
              <span className="line-p">{jd(l.unit * l.qty)}</span>
            </div>
          );
        })}
      </div>

      <div className="cart-foot">
        {cart.length > 0 && (
          <>
            <div className="sumline sumline-big">
              <span>{t.subtotal}</span>
              <b>{jd(total)} JD</b>
            </div>
            <button className="primary full" onClick={onSubmit}>
              {rounds.length ? t.addMore : t.send}
            </button>
            <button className="ghost full" onClick={onClear}>{t.clear}</button>
          </>
        )}
        {cart.length === 0 && rounds.length > 0 && (
          <button className="primary full" onClick={onBill}>{t.viewBill}</button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- bill -------------------------------- */

const METHODS = [
  { id: "applepay", name: "Apple Pay", nameAr: "Apple Pay", glyph: "apple" },
  { id: "googlepay", name: "Google Pay", nameAr: "Google Pay", glyph: "G" },
  { id: "card", name: "Visa / Mastercard", nameAr: "فيزا / ماستركارد", glyph: "card" },
  { id: "cash", name: "Cash at the table", nameAr: "نقداً على الطاولة", glyph: "₪" },
];

function CardMark({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      <path d="M2 10h20" />
    </svg>
  );
}

function AppleMark({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <path d="M16.37 1.43c0 1.14-.49 2.27-1.18 3.08-.74.9-1.99 1.57-2.99 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.57-2.27 1.21-2.98.8-.94 2.14-1.64 3.25-1.68.03.13.05.28.05.43ZM20.93 17.14c-.03.07-.46 1.58-1.52 3.12-.94 1.34-1.93 2.68-3.47 2.71-1.53.03-2.02-.89-3.75-.89-1.73 0-2.27.87-3.72.92-1.5.05-2.64-1.44-3.6-2.78-1.97-2.75-3.47-7.79-1.44-11.19 1-1.67 2.8-2.75 4.7-2.77 1.5-.02 2.85.99 3.74.99.9 0 2.55-1.22 4.28-1.05.75.03 2.85.3 4.19 2.28-.11.06-2.5 1.44-2.47 4.31.03 3.43 3.06 4.57 3.09 4.58Z" />
    </svg>
  );
}

function Bill({
  t, isAr, rounds, subtotal, service, tax, tipAmt, grand,
  tip, setTip, payMethod, setPayMethod, paying, onPay, onBack,
}) {
  return (
    <div className="billwrap">
      <button className="ghost back" onClick={onBack}>← {t.back}</button>

      <div className="billcard">
        <div className="bill-head">
          <Thyme size={14} color="var(--sumac)" />
          <h2>{t.bill}</h2>
          <p>{t.billFor}</p>
        </div>

        {rounds.map((r) => (
          <div key={r.id} className="bill-round">
            <div className="bill-round-h">{t.round} {r.n}</div>
            {r.lines.map((l) => {
              const it = MENU.find((m) => m.id === l.itemId);
              const opts = selLabel(it, l.sel, isAr ? "ar" : "en");
              return (
                <div key={l.lineId} className="bline">
                  <span className="bq">{l.qty}</span>
                  <div className="bmid">
                    <span className="bn">{isAr ? it.nameAr : it.name}</span>
                    {opts.length > 0 && <span className="bo">{opts.join(" · ")}</span>}
                    {l.note && <span className="bnote">“{l.note}”</span>}
                    <span className="bunit">{jd(l.unit)} JD {t.each}</span>
                  </div>
                  <span className="bp">{jd(l.unit * l.qty)}</span>
                </div>
              );
            })}
          </div>
        ))}

        <div className="totals">
          <div className="sumline"><span>{t.subtotal}</span><span>{jd(subtotal)}</span></div>
          <div className="sumline"><span>{t.service} (10%)</span><span>{jd(service)}</span></div>
          <div className="sumline"><span>{t.tax} (16%)</span><span>{jd(tax)}</span></div>
          {tipAmt > 0 && <div className="sumline"><span>{t.tip}</span><span>{jd(tipAmt)}</span></div>}
          <div className="sumline sumline-grand"><span>{t.total}</span><span>{jd(grand)} JD</span></div>
        </div>

        <div className="tips">
          <span className="tips-l">{t.tip}</span>
          {[0, 0.05, 0.1, 0.15].map((v) => (
            <button key={v} className={"tipb" + (tip === v ? " tipb-on" : "")} onClick={() => setTip(v)}>
              {v === 0 ? "—" : Math.round(v * 100) + "%"}
            </button>
          ))}
        </div>

        <div className="pay">
          <h3>{t.payMethod}</h3>
          <div className="methods">
            {METHODS.map((m) => (
              <button
                key={m.id}
                className={"method" + (payMethod === m.id ? " method-on" : "") + (m.id === "applepay" ? " m-apple" : "") + (m.id === "googlepay" ? " m-google" : "")}
                onClick={() => setPayMethod(m.id)}
              >
                <span className="mglyph">
                  {m.id === "applepay" ? <AppleMark /> : m.id === "card" ? <CardMark /> : m.glyph}
                </span>
                <span>{isAr ? m.nameAr : m.name}</span>
              </button>
            ))}
          </div>

          <button className="primary full pay-btn" disabled={!payMethod || paying} onClick={onPay}>
            {paying ? t.processing : `${t.payNow} · ${jd(grand)} JD`}
          </button>
          <p className="paynote">
            {isAr
              ? "الدفع يتم عبر بوابة آمنة. الفاتورة الضريبية تصدر من نظام نقاط البيع في المطعم."
              : "Payment runs through a secure gateway. The tax invoice is issued by the restaurant's POS."}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ receipt ------------------------------- */

function Receipt({ t, isAr, receipt, rounds, subtotal, service, tax, tipAmt, grand, onReset }) {
  const m = METHODS.find((x) => x.id === receipt.method);
  return (
    <div className="billwrap">
      <div className="billcard">
        <div className="paid-head">
          <div className="paid-mark"><Thyme size={22} color="var(--paper)" /></div>
          <h2>{t.thanks}</h2>
          <p>{t.thanksSub}</p>
        </div>

        <div className="inv">
          <div className="inv-row"><span>{t.invoice}</span><b className="mono">{receipt.no}</b></div>
          <div className="inv-row"><span>{t.table}</span><b>12</b></div>
          <div className="inv-row"><span>{receipt.at.toLocaleString(isAr ? "ar-JO" : "en-GB")}</span><b>{isAr ? m.nameAr : m.name}</b></div>
        </div>

        <div className="totals">
          <div className="sumline"><span>{t.subtotal}</span><span>{jd(subtotal)}</span></div>
          <div className="sumline"><span>{t.service}</span><span>{jd(service)}</span></div>
          <div className="sumline"><span>{t.tax}</span><span>{jd(tax)}</span></div>
          {tipAmt > 0 && <div className="sumline"><span>{t.tip}</span><span>{jd(tipAmt)}</span></div>}
          <div className="sumline sumline-grand"><span>{t.paid}</span><span>{jd(grand)} JD</span></div>
        </div>

        <button className="ghost full" onClick={onReset}>{t.newOrder}</button>
      </div>
    </div>
  );
}

/* ----------------------------- chef chat ------------------------------ */

function ChefChat({ t, isAr, lang, onClose, onPick }) {
  const [msgs, setMsgs] = useState([{ role: "assistant", text: t.chatIntro, suggest: [] }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const compactMenu = useMemo(
    () =>
      MENU.map((m) => ({
        id: m.id, name: m.name, ar: m.nameAr, price: m.price, cat: m.cat,
        desc: m.desc, allergens: m.allergens, tags: m.tags,
        options: m.groups.map((g) => g.name + ": " + g.options.map((o) => o.name).join("/")),
        available: !UNAVAILABLE.includes(m.id),
      })),
    []
  );

  const send = async () => {
    const q = input.trim();
    if (!q || busy) return;
    const history = [...msgs, { role: "user", text: q }];
    setMsgs(history);
    setInput("");
    setBusy(true);

    const sys = `You are the kitchen assistant for Leaf, a Levantine restaurant in Amman, Jordan. A guest is ordering from their table using the QR menu.

MENU (JSON): ${JSON.stringify(compactMenu)}

Rules:
- Answer only about this restaurant, its menu, allergens, ingredients, spice levels, portion sizes and possible modifications.
- If a guest asks for a change, judge whether the kitchen can do it from the listed options and ingredients. Say plainly yes or no and why.
- Items with available:false are sold out today. Never recommend them.
- Be brief and warm. Two or three sentences. No bullet lists.
- Reply in the guest's language (${lang === "ar" ? "Arabic" : "English"}) unless they clearly write in the other one.
- Never invent dishes or prices that are not in the menu JSON.

Respond with ONLY a JSON object, no markdown fences, no preamble:
{"reply":"your answer","suggest":["itemId","itemId"],"feasible":true|false|null}
"suggest" holds at most three ids from the menu that the guest should look at, or an empty array.
"feasible" is true or false when the guest asked whether a change is possible, otherwise null.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: sys,
          messages: history.map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      });
      const data = await res.json();
      const raw = data.content.filter((c) => c.type === "text").map((c) => c.text).join("\n");
      let parsed;
      try {
        parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      } catch {
        parsed = { reply: raw, suggest: [], feasible: null };
      }
      setMsgs((m) => [...m, {
        role: "assistant",
        text: parsed.reply || raw,
        suggest: (parsed.suggest || []).filter((id) => MENU.some((x) => x.id === id)),
        feasible: parsed.feasible,
      }]);
    } catch (e) {
      setMsgs((m) => [...m, {
        role: "assistant",
        text: isAr
          ? "ما قدرت أوصل للمطبخ هلأ. جرّب مرة ثانية أو نادِ النادل."
          : "I couldn't reach the kitchen just now. Try again, or call a waiter.",
        suggest: [],
      }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ovl ovl-chat" onClick={onClose}>
      <div className="chat" onClick={(e) => e.stopPropagation()}>
        <div className="chat-head">
          <div className="chat-mark"><Thyme size={13} color="var(--paper)" /></div>
          <div className="chat-title">
            <b>{t.askChef}</b>
            <span>{t.chefSub}</span>
          </div>
          <button className="sheet-x" onClick={onClose} aria-label={t.close}>×</button>
        </div>

        <div className="chat-body">
          {msgs.map((m, i) => (
            <div key={i} className={"bub bub-" + m.role}>
              <p>{m.text}</p>
              {m.feasible === true && <span className="feas feas-y">✓ {isAr ? "المطبخ يقدر يعملها" : "The kitchen can do this"}</span>}
              {m.feasible === false && <span className="feas feas-n">✕ {isAr ? "المطبخ ما بيقدر يعملها" : "The kitchen can't do this"}</span>}
              {m.suggest && m.suggest.length > 0 && (
                <div className="sugg">
                  <span className="sugg-l">{t.suggested}</span>
                  {m.suggest.map((id) => {
                    const it = MENU.find((x) => x.id === id);
                    return (
                      <button key={id} className="suggb" onClick={() => onPick(id)}>
                        <span>{it.emoji}</span>
                        <span>{isAr ? it.nameAr : it.name}</span>
                        <b>{jd(it.price)}</b>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {busy && <div className="bub bub-assistant bub-wait"><i /><i /><i /><span>{t.thinking}</span></div>}
          <div ref={endRef} />
        </div>

        <div className="chat-foot">
          <input
            value={input} placeholder={t.chatPh}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          />
          <button className="primary" onClick={send} disabled={busy || !input.trim()}>↑</button>
        </div>
      </div>
    </div>
  );
}

/* ================================ CSS ================================= */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap');

/* overflow-x:clip (not hidden) — hidden would make these scroll containers and
   break position:sticky for the cart panel */
html,body{margin:0;padding:0;width:100%;overflow-x:clip;background:#EDEFE6}
#root{overflow-x:clip}

.app{
  --ink:#12403B; --ink2:#0B2C29; --paper:#EDEFE6; --card:#FBFCF7;
  --sumac:#B4442E; --brass:#C98F2B; --olive:#6F7A56;
  --line:rgba(18,64,59,.13); --line-solid:#C6CDBE; --muted:#5C6B62;
  background:var(--paper); color:var(--ink); min-height:100vh; width:100%;
  font-family:'IBM Plex Sans Arabic',system-ui,sans-serif;
  -webkit-font-smoothing:antialiased; padding-bottom:90px; overflow-x:clip;
  box-sizing:border-box;
}
.app *{box-sizing:border-box}
.app h1,.app h2,.app h3,.app h4{font-family:'Bricolage Grotesque','IBM Plex Sans Arabic',sans-serif;margin:0;letter-spacing:-.02em}
.app[dir="rtl"] h1,.app[dir="rtl"] h2,.app[dir="rtl"] h3,.app[dir="rtl"] h4{font-family:'IBM Plex Sans Arabic',sans-serif}
/* :where() drops the button part to zero specificity, so this stays a plain
   reset instead of out-weighing every component rule below it (.primary,
   .mobar, .chef-fab, .addbtn, …) and stripping their background/colour */
.app :where(button){font-family:inherit;cursor:pointer;border:none;background:none;color:inherit}
.app button:focus-visible,.app input:focus-visible,.app textarea:focus-visible{outline:2px solid var(--sumac);outline-offset:2px}
.mono{font-family:'IBM Plex Mono',monospace}

/* header */
.hdr{position:sticky;top:0;z-index:40;color:#fff;overflow:hidden;
  background-image:radial-gradient(ellipse 60% 90% at 22% -30%,rgba(255,255,255,.22),transparent 65%),
    linear-gradient(108deg,#0A4A2A 0%,#146639 40%,#1F8A4E 78%,#2FBE79 105%)}
.hdr-leaf{position:absolute;top:50%;width:190px;height:190px;fill:#fff;opacity:.14;pointer-events:none}
.hdr-leaf-end{inset-inline-end:-30px;transform:translateY(-50%) rotate(14deg)}
.hdr-leaf-start{inset-inline-start:-60px;transform:translateY(-50%) rotate(-8deg) scaleX(-1);opacity:.1}
.hdr-in{position:relative;z-index:1;max-width:1320px;margin:0 auto;padding:14px 20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:11px;margin-inline-end:auto}
.mark{width:36px;height:36px;display:grid;place-items:center}
.brand h1{font-size:19px;font-weight:800}
.brand p{margin:1px 0 0;font-size:11.5px;opacity:.62;letter-spacing:.02em}
.hdr-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.table-tag{display:flex;align-items:center;gap:7px;font-size:12.5px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.16);padding:7px 12px;border-radius:999px}
.table-tag b{font-family:'IBM Plex Mono',monospace}
.dot{width:6px;height:6px;border-radius:50%;background:#7ED9A0;box-shadow:0 0 0 3px rgba(126,217,160,.2)}
.ghost{font-size:12.5px;padding:7px 13px;border-radius:999px;border:1px solid rgba(255,255,255,.22);background:transparent;color:inherit;transition:background .15s}
.ghost:hover{background:rgba(255,255,255,.1)}
.lang{font-size:12.5px;font-weight:600;padding:7px 13px;border-radius:999px;background:var(--paper);color:var(--ink)}

/* category bar */
.catbar{position:sticky;top:64px;z-index:30;background:rgba(237,239,230,.94);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.catbar-in{max-width:1320px;margin:0 auto;padding:11px 20px;display:flex;gap:7px;overflow-x:auto;scrollbar-width:none}
.catbar-in::-webkit-scrollbar{display:none}
.chip{white-space:nowrap;font-size:13px;padding:7px 15px;border-radius:999px;border:1px solid var(--line);color:var(--muted);transition:all .15s}
.chip:hover{border-color:var(--ink)}
.chip-on{background:var(--ink);color:var(--paper);border-color:var(--ink);font-weight:600}

/* shell */
.shell{max-width:1320px;margin:0 auto;padding:26px 20px 40px;display:grid;grid-template-columns:1fr 372px;gap:30px}
/* min-width:0 lets the 1fr track shrink below its content width, so the phone
   card rails can actually scroll instead of stretching the column */
.menu{align-self:start;min-width:0}
@media(max-width:1000px){.shell{grid-template-columns:1fr;padding:20px 16px 40px}}

/* categories */
.cat{margin-bottom:38px;scroll-margin-top:150px}
.cat-head{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.cat-head h2{font-size:22px;font-weight:800}
.rule{flex:1;height:1px;background:var(--line)}
.cat-alt{font-size:12px;color:var(--muted);opacity:.75}

.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(255px,1fr));gap:14px}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;transition:transform .18s,box-shadow .18s,border-color .18s}
.card:hover{transform:translateY(-2px);box-shadow:0 10px 26px rgba(18,64,59,.09);border-color:rgba(18,64,59,.24)}
.card-out{opacity:.55}
.card-out:hover{transform:none;box-shadow:none}
.card-in{border-color:var(--ink);box-shadow:inset 0 0 0 1px var(--ink)}
.card-imgwrap{position:relative}
.card-clickable{cursor:pointer}
.card-clickable:focus-visible{outline:2px solid var(--sumac);outline-offset:2px}
.card-clickable .dish-wrap img,.card-clickable .dish-fb{transition:transform .25s ease}
.card-clickable:hover .dish-wrap img,.card-clickable:hover .dish-fb{transform:scale(1.04)}
.incart{position:absolute;top:9px;inset-inline-start:9px;background:var(--ink);color:var(--paper);
  font-size:10.5px;font-weight:600;letter-spacing:.02em;padding:4px 9px;border-radius:999px;
  display:flex;align-items:center;gap:5px;box-shadow:0 3px 10px rgba(11,44,41,.35)}
.incart b{font-family:'IBM Plex Mono',monospace;font-size:12px}
.addbtn-on{background:var(--sumac)}
.addbtn-n{font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:600}

.dish-wrap,.dish-fb{position:relative;overflow:hidden;background:
  linear-gradient(135deg,hsl(var(--h) 42% 82%),hsl(calc(var(--h) + 22) 34% 68%));display:grid;place-items:center}
.dish-wrap img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center}
.dish-emoji{font-size:34px;filter:saturate(.9)}
.dish-under{opacity:.85}
.card-img{aspect-ratio:4/3;height:auto}
.sheet-img{aspect-ratio:16/9;height:auto}
.sheet-img .dish-emoji{font-size:52px}

.card-body{padding:13px 14px 12px;display:flex;flex-direction:column;gap:7px;flex:1}
.card-top{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.card-top h3{font-size:15.5px;font-weight:700}
.card-desc{margin:0;font-size:12.5px;line-height:1.55;color:var(--muted)}
.tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:auto}
.tag{font-size:10px;letter-spacing:.04em;text-transform:uppercase;padding:3px 7px;border-radius:5px;background:rgba(18,64,59,.07);color:var(--muted);font-weight:600}
.tag-popular{background:rgba(201,143,43,.18);color:#8A5F12}
.tag-spicy{background:rgba(180,68,46,.14);color:var(--sumac)}
.tag-vegan,.tag-vegetarian{background:rgba(111,122,86,.16);color:#4C5539}
.tag-chef,.tag-national{background:rgba(18,64,59,.12);color:var(--ink)}
.tag-time{font-family:'IBM Plex Mono',monospace;background:transparent;border:1px solid var(--line)}
.card-foot{display:flex;align-items:center;justify-content:space-between;margin-top:4px}
.price{font-family:'IBM Plex Mono',monospace;font-size:17px;font-weight:600}
.price i{font-style:normal;font-size:11px;opacity:.55}
.addbtn{width:34px;height:34px;border-radius:11px;background:var(--ink);color:var(--paper);font-size:20px;line-height:1;transition:background .15s,transform .12s}
.addbtn:hover{background:var(--sumac);transform:scale(1.06)}
.soldout{font-size:11px;color:var(--sumac);font-weight:600;border:1px dashed rgba(180,68,46,.4);padding:4px 8px;border-radius:6px}

.foot{display:flex;align-items:center;gap:9px;padding-top:12px;border-top:1px solid var(--line)}
.foot p{margin:0;font-size:11.5px;color:var(--muted);line-height:1.5}

/* cart */
/* top matches the cart's at-rest offset (header 64 + catbar 57 + shell pad 26)
   so it doesn't visibly jump when it starts sticking */
.cart-in{position:sticky;top:147px;background:var(--card);border:1px solid var(--line);border-radius:18px;display:flex;flex-direction:column;max-height:calc(100vh - 175px);overflow:hidden}
@media(max-width:1000px){
  .cart{position:fixed;inset:0;z-index:60;background:rgba(11,44,41,.5);display:none;top:0}
  .cart-open{display:block}
  .cart-in{position:absolute;bottom:0;left:0;right:0;max-height:88vh;border-radius:20px 20px 0 0}
  .cart-x{display:block !important}
}
.cart-head{padding:15px 17px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between}
.cart-head h2{font-size:16px;font-weight:700}
.cart-x{display:none;font-size:26px;line-height:1;color:var(--muted)}
.sheet-grab{display:none}
.cart-scroll{overflow-y:auto;padding:8px 0;flex:1;min-height:120px}

.empty{padding:44px 24px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:7px}
.empty b{font-size:14px}
.empty span{font-size:12.5px;color:var(--muted);line-height:1.5;max-width:220px}

.line{display:flex;gap:10px;padding:11px 16px;align-items:flex-start;border-bottom:1px solid var(--line)}
.line:last-child{border-bottom:none}
.line-locked{opacity:.8}
.line-q{font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;min-width:24px;padding-top:2px}
.line-stp{display:flex;align-items:center;gap:2px;border:1px solid var(--line);border-radius:8px;overflow:hidden;flex-shrink:0}
.line-stp button{width:23px;height:26px;font-size:14px;color:var(--muted)}
.line-stp button:hover{background:rgba(18,64,59,.06);color:var(--ink)}
.line-stp span{font-family:'IBM Plex Mono',monospace;font-size:12.5px;min-width:17px;text-align:center}
.line-mid{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}
.line-n{font-size:13.5px;font-weight:600;line-height:1.3}
.line-o{font-size:11.5px;color:var(--muted);line-height:1.4}
.line-note{font-size:11.5px;color:var(--sumac);font-style:italic;line-height:1.4}
.line-actions{display:flex;gap:6px;margin-top:4px}
.line-edit{display:inline-flex;align-items:center;gap:4px;align-self:flex-start;
  font-size:11px;font-weight:600;color:var(--muted);padding:3px 8px;border-radius:6px;
  border:1px solid var(--line);transition:all .13s}
.line-edit:hover{color:var(--ink);border-color:var(--ink);background:rgba(18,64,59,.05)}
.line-delete:hover{color:var(--sumac);border-color:var(--sumac);background:rgba(180,68,46,.07)}
.editing-note{font-size:11px;font-weight:600;color:var(--brass);background:rgba(201,143,43,.12);
  border:1px solid rgba(201,143,43,.3);padding:6px 10px;border-radius:8px;margin-bottom:10px}
.removebtn{border-color:rgba(180,68,46,.35);color:var(--sumac);padding:13px 15px;font-size:13px;border-radius:12px}
.removebtn:hover{background:rgba(180,68,46,.07);border-color:var(--sumac)}
.line-p{font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600}

.round{border-bottom:1px solid var(--line);padding-bottom:6px;margin-bottom:4px}
.round-head{display:flex;align-items:center;justify-content:space-between;padding:9px 16px 4px}
.round-n{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);font-weight:600}
.pill{font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:999px;text-transform:uppercase;letter-spacing:.04em}
.pill-received{background:rgba(201,143,43,.2);color:#8A5F12}
.pill-preparing{background:rgba(180,68,46,.15);color:var(--sumac)}
.pill-ready{background:rgba(111,122,86,.2);color:#42502F}
.pill-served{background:rgba(18,64,59,.1);color:var(--muted)}

.track{display:flex;gap:4px;padding:6px 16px 10px}
.node{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:9.5px;color:var(--line-solid);position:relative}
.node span{text-align:center;line-height:1.2}
.node-on{color:var(--ink);font-weight:600}

.editwin{margin:8px 16px 10px;background:rgba(201,143,43,.09);border:1px solid rgba(201,143,43,.32);border-radius:11px;padding:10px 11px}
.editwin-top{display:flex;justify-content:space-between;align-items:center;font-size:11.5px;font-weight:600;margin-bottom:7px}
.count{font-family:'IBM Plex Mono',monospace;color:var(--sumac)}
.bar{height:3px;background:rgba(201,143,43,.25);border-radius:99px;overflow:hidden}
.bar i{display:block;height:100%;background:var(--brass);transition:width .5s linear}
.editwin-btns{display:flex;gap:6px;margin-top:9px}
.mini{flex:1;font-size:12px;font-weight:600;padding:7px;border-radius:8px;border:1px solid var(--line);background:var(--card);transition:all .13s}
.mini:hover{border-color:var(--brass);background:rgba(201,143,43,.14)}
.mini-danger{color:var(--sumac);border-color:rgba(180,68,46,.35)}
.mini-danger:hover{background:rgba(180,68,46,.07);border-color:var(--sumac)}
.editwin-skip{margin-top:10px;padding-top:10px;border-top:1px dashed rgba(201,143,43,.35)}
.editwin-pay{width:100%;padding:8px;border-radius:8px;font-size:12.5px;font-weight:700;
  border:1.5px solid #1FA35C;background:transparent;color:#178A52;transition:all .13s}
.editwin-pay:hover{background:#1FA35C;color:#fff}
.lockedbox{margin:8px 16px 10px;padding:9px 11px;border-radius:11px;background:rgba(18,64,59,.05);display:flex;flex-direction:column;gap:2px}
.lockedbox b{font-size:12px}
.lockedbox span{font-size:11.5px;color:var(--muted)}

.cart-foot{padding:13px 16px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:8px;background:var(--card)}
.sumline{display:flex;justify-content:space-between;font-size:13px;color:var(--muted)}
.sumline span:last-child{font-family:'IBM Plex Mono',monospace}
.sumline-big{font-size:15px;color:var(--ink)}
.sumline-big b{font-family:'IBM Plex Mono',monospace;font-size:17px}

.primary{background:var(--ink);color:var(--paper);border-radius:12px;padding:13px 18px;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:10px;transition:background .15s}
.primary:hover:not(:disabled){background:var(--sumac)}
.primary:disabled{opacity:.4;cursor:not-allowed}
.full{width:100%}
.grow{flex:1}
.btn-p{font-family:'IBM Plex Mono',monospace;opacity:.85}
.ghost.full{border-color:var(--line);color:var(--muted);padding:10px}
.ghost.full:hover{background:rgba(18,64,59,.05);color:var(--ink)}

/* mobile bar */
.mobar{display:none}
@media(max-width:1000px){
  .mobar{display:flex;position:fixed;bottom:16px;left:16px;right:16px;z-index:50;background:var(--ink);color:var(--paper);
    border-radius:14px;padding:14px 16px;align-items:center;gap:11px;font-size:14px;font-weight:600;box-shadow:0 10px 30px rgba(11,44,41,.32)}
  .mobar-n{background:rgba(255,255,255,.18);width:24px;height:24px;border-radius:7px;display:grid;place-items:center;font-family:'IBM Plex Mono',monospace;font-size:12px}
  .mobar-p{margin-inline-start:auto;font-family:'IBM Plex Mono',monospace}
  .app{padding-bottom:92px}
}

/* chef fab */
.chef-fab{position:fixed;bottom:20px;z-index:45;inset-inline-end:20px;background:var(--sumac);color:var(--paper);
  border-radius:999px;padding:12px 18px;display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600;
  box-shadow:0 8px 24px rgba(180,68,46,.35);transition:transform .15s}
.chef-fab:hover{transform:translateY(-2px)}
@media(max-width:1000px){
  .chef-fab{bottom:calc(14px + env(safe-area-inset-bottom));inset-inline-end:14px;
    padding:11px 15px;font-size:12.5px;transition:bottom .18s ease}
  .chef-fab-raised{bottom:calc(78px + env(safe-area-inset-bottom))} /* clear the order bar */
}

/* overlay + sheet */
.ovl{position:fixed;inset:0;z-index:70;background:rgba(11,44,41,.55);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fade .18s ease}
@keyframes fade{from{opacity:0}to{opacity:1}}
.sheet{background:var(--card);border-radius:20px;width:100%;max-width:480px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;animation:rise .22s cubic-bezier(.2,.8,.3,1)}
@keyframes rise{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}
@media(max-width:600px){.ovl{padding:0;align-items:flex-end}.sheet{max-height:94vh;border-radius:20px 20px 0 0}}
.sheet-hero{position:relative}
.sheet-x{position:absolute;top:10px;inset-inline-end:12px;width:32px;height:32px;border-radius:50%;background:rgba(11,44,41,.55);color:#fff;font-size:22px;line-height:1;display:grid;place-items:center}
.sheet-body{padding:16px 18px;overflow-y:auto;flex:1}
.sheet-body h3{font-size:20px;font-weight:800}
.sheet-desc{margin:8px 0 0;font-size:13px;line-height:1.6;color:var(--muted)}
.sheet-meta{display:flex;gap:10px;flex-wrap:wrap;margin:11px 0 4px;font-size:11.5px;color:var(--muted)}
.allerg{color:var(--sumac);background:rgba(180,68,46,.09);padding:2px 8px;border-radius:5px}

.group{margin-top:18px}
.group-head{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px}
.group-head h4{font-size:13.5px;font-weight:700}
.req{font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}
.req-on{color:var(--sumac);font-weight:700}
.opts{display:flex;flex-direction:column;gap:6px}
.opt{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;font-size:13px;text-align:start;transition:all .13s}
.opt:hover{border-color:rgba(18,64,59,.34)}
.opt-on{border-color:var(--ink);background:rgba(18,64,59,.05)}
.radio,.check{width:15px;height:15px;border:1.5px solid var(--line-solid);flex-shrink:0;position:relative}
.radio{border-radius:50%}
.check{border-radius:4px}
.opt-on .radio,.opt-on .check{border-color:var(--ink);background:var(--ink)}
.opt-on .radio::after{content:"";position:absolute;inset:3.5px;border-radius:50%;background:var(--card)}
.opt-on .check::after{content:"✓";position:absolute;inset:0;color:var(--card);font-size:10px;display:grid;place-items:center}
.opt-name{flex:1}
.opt-p{font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--muted)}
.notes{width:100%;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-family:inherit;font-size:13px;resize:vertical;background:var(--paper);color:var(--ink)}
.notes::placeholder{color:var(--muted);opacity:.65}

.sheet-foot{padding:13px 16px;border-top:1px solid var(--line);display:flex;gap:10px;align-items:center;background:var(--card)}
.stepper{display:flex;align-items:center;border:1px solid var(--line);border-radius:12px;overflow:hidden}
.stepper button{width:38px;height:44px;font-size:17px;color:var(--muted)}
.stepper button:hover{background:rgba(18,64,59,.06);color:var(--ink)}
.stepper span{font-family:'IBM Plex Mono',monospace;min-width:26px;text-align:center;font-size:14px}

/* bill */
.billwrap{grid-column:1 / -1;max-width:640px;margin:0 auto;width:100%}
.back{border-color:var(--line);color:var(--muted);margin-bottom:14px}
.back:hover{background:rgba(18,64,59,.05)}
.billcard{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:24px}
.bill-head{text-align:center;padding-bottom:18px;border-bottom:1px dashed var(--line-solid);margin-bottom:16px}
.bill-head h2{font-size:24px;font-weight:800;margin-top:6px}
.bill-head p{margin:4px 0 0;font-size:12.5px;color:var(--muted)}
.bill-round-h{font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700;margin:14px 0 6px}
.bline{display:flex;gap:12px;padding:9px 0;border-bottom:1px solid var(--line);align-items:flex-start}
.bq{font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;min-width:20px}
.bmid{flex:1;display:flex;flex-direction:column;gap:2px}
.bn{font-size:14px;font-weight:600}
.bo,.bunit{font-size:11.5px;color:var(--muted)}
.bunit{font-family:'IBM Plex Mono',monospace;opacity:.8}
.bnote{font-size:11.5px;color:var(--sumac);font-style:italic}
.bp{font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:600}

.totals{margin-top:18px;padding-top:14px;border-top:1px dashed var(--line-solid);display:flex;flex-direction:column;gap:7px}
.sumline-grand{margin-top:8px;padding-top:11px;border-top:1px solid var(--ink);font-size:18px;font-weight:800;color:var(--ink)}
.sumline-grand span:last-child{font-size:20px}

.tips{display:flex;align-items:center;gap:6px;margin-top:18px;flex-wrap:wrap}
.tips-l{font-size:12.5px;color:var(--muted);margin-inline-end:auto}
.tipb{padding:7px 14px;border:1px solid var(--line);border-radius:9px;font-size:12.5px;font-family:'IBM Plex Mono',monospace}
.tipb:hover{border-color:var(--ink)}
.tipb-on{background:var(--ink);color:var(--paper);border-color:var(--ink)}

.pay{margin-top:24px;padding-top:20px;border-top:1px solid var(--line)}
.pay h3{font-size:15px;font-weight:700;margin-bottom:12px}
.methods{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}
@media(max-width:480px){.methods{grid-template-columns:1fr}}
.method{display:flex;align-items:center;gap:10px;padding:13px 14px;border:1px solid var(--line);border-radius:12px;font-size:13px;font-weight:600;text-align:start;transition:all .14s}
.method:hover{border-color:rgba(18,64,59,.35)}
.method-on{border-color:var(--ink);background:rgba(18,64,59,.05);box-shadow:inset 0 0 0 1px var(--ink)}
.mglyph{width:26px;height:26px;border-radius:7px;background:rgba(18,64,59,.08);display:grid;place-items:center;font-size:13px;flex-shrink:0}
.m-apple .mglyph{background:#000;color:#fff}
.m-google .mglyph{background:#fff;color:#4285F4;border:1px solid var(--line);font-weight:700}
.pay-btn{padding:16px}
.paynote{margin:11px 0 0;font-size:11.5px;color:var(--muted);line-height:1.5;text-align:center}

/* receipt */
.paid-head{text-align:center;padding-bottom:20px}
.paid-mark{width:56px;height:56px;border-radius:18px;background:var(--ink);display:grid;place-items:center;margin:0 auto 12px}
.paid-head h2{font-size:26px;font-weight:800}
.paid-head p{margin:6px 0 0;font-size:13px;color:var(--muted)}
.inv{border-top:1px dashed var(--line-solid);border-bottom:1px dashed var(--line-solid);padding:12px 0;display:flex;flex-direction:column;gap:6px}
.inv-row{display:flex;justify-content:space-between;font-size:12.5px;color:var(--muted)}
.inv-row b{color:var(--ink)}

/* chat */
.ovl-chat{align-items:flex-end;justify-content:flex-end;padding:20px}
@media(max-width:600px){.ovl-chat{padding:0}}
.chat{background:var(--card);border-radius:20px;width:100%;max-width:420px;height:min(620px,88vh);display:flex;flex-direction:column;overflow:hidden;animation:rise .22s cubic-bezier(.2,.8,.3,1)}
@media(max-width:600px){.chat{height:92vh;border-radius:20px 20px 0 0;max-width:none}}
.chat-head{display:flex;align-items:center;gap:11px;padding:14px 16px;background:var(--ink);color:var(--paper);position:relative}
.chat-mark{width:30px;height:30px;border-radius:9px;background:rgba(255,255,255,.13);display:grid;place-items:center}
.chat-title{display:flex;flex-direction:column;line-height:1.3}
.chat-title b{font-size:14px}
.chat-title span{font-size:11px;opacity:.65}
.chat-head .sheet-x{background:rgba(255,255,255,.14)}
.chat-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
.bub{max-width:88%;padding:11px 13px;border-radius:14px;font-size:13.5px;line-height:1.6}
.bub p{margin:0}
.bub-assistant{background:rgba(18,64,59,.06);border-start-start-radius:4px;align-self:flex-start}
.bub-user{background:var(--ink);color:var(--paper);border-end-end-radius:4px;align-self:flex-end}
.bub-wait{display:flex;align-items:center;gap:5px;color:var(--muted);font-size:12px}
.bub-wait i{width:5px;height:5px;border-radius:50%;background:var(--line-solid);animation:blink 1.1s infinite}
.bub-wait i:nth-child(2){animation-delay:.18s}
.bub-wait i:nth-child(3){animation-delay:.36s;margin-inline-end:5px}
@keyframes blink{0%,60%,100%{opacity:.3}30%{opacity:1}}
.feas{display:inline-block;margin-top:8px;font-size:11.5px;font-weight:700;padding:3px 9px;border-radius:6px}
.feas-y{background:rgba(111,122,86,.2);color:#42502F}
.feas-n{background:rgba(180,68,46,.14);color:var(--sumac)}
.sugg{margin-top:10px;display:flex;flex-direction:column;gap:5px}
.sugg-l{font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);font-weight:700}
.suggb{display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--card);border:1px solid var(--line);border-radius:9px;font-size:12.5px;font-weight:600;text-align:start}
.suggb:hover{border-color:var(--ink)}
.suggb b{margin-inline-start:auto;font-family:'IBM Plex Mono',monospace}
.chat-foot{padding:12px;border-top:1px solid var(--line);display:flex;gap:8px}
.chat-foot input{flex:1;border:1px solid var(--line);border-radius:11px;padding:11px 13px;font-family:inherit;font-size:13px;background:var(--paper);color:var(--ink)}
.chat-foot input::placeholder{color:var(--muted);opacity:.65}
.chat-foot .primary{padding:11px 15px;font-size:16px}

/* toast */
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:90;background:var(--ink);color:var(--paper);
  padding:11px 20px;border-radius:999px;font-size:13px;font-weight:600;box-shadow:0 8px 26px rgba(11,44,41,.3);animation:pop .2s ease;
  max-width:min(90vw,420px);text-align:center;line-height:1.45}
.toast-warn{background:var(--sumac)}
@keyframes pop{from{transform:translate(-50%,10px);opacity:0}to{transform:translate(-50%,0);opacity:1}}
@keyframes popFlat{from{transform:translateY(10px);opacity:0}to{transform:none;opacity:1}}
@media(max-width:1000px){.toast{bottom:140px}}

/* ---------------------- phone layout ----------------------
   Categories stay stacked vertically; the dishes inside each one
   become a horizontal swipe rail of compact cards, and the cart
   reads as a proper bottom sheet.                            */
@media(max-width:700px){
  .cat{margin-bottom:26px}
  .cat-head{margin-bottom:11px;gap:8px}
  .cat-head h2{font-size:18px}

  .grid{
    display:flex;gap:10px;
    overflow-x:auto;overscroll-behavior-x:contain;
    scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;
    margin-inline:-16px;padding:2px 16px 6px; /* bleed past .shell padding to the screen edge */
  }
  .grid::-webkit-scrollbar{display:none}
  .card{flex:0 0 165px;scroll-snap-align:start;border-radius:14px}
  .card:hover{transform:none;box-shadow:0 1px 2px rgba(18,64,59,.05)}

  .card-body{padding:10px 11px 11px;gap:5px}
  .card-top{gap:5px}
  .card-top h3{font-size:13.5px}
  .card-alt{font-size:10.5px}
  .card-desc{font-size:11px;line-height:1.45;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .tags{gap:4px}
  .tag{font-size:9px;padding:2px 5px;white-space:nowrap}
  .price{font-size:15px}
  .price i{font-size:10px}
  .addbtn{width:30px;height:30px;font-size:18px;border-radius:9px}
  .incart{top:7px;inset-inline-start:7px;font-size:9.5px;padding:3px 7px}

  .cart-in{max-height:86dvh;border-radius:22px 22px 0 0;box-shadow:0 -14px 40px rgba(11,44,41,.28)}
  .sheet-grab{display:block;width:38px;height:4px;border-radius:99px;
    background:var(--line-solid);margin:9px auto 0;flex-shrink:0}
  .cart-head{padding:8px 16px 12px}
  .cart-foot{padding-bottom:calc(13px + env(safe-area-inset-bottom))}
  .mobar{bottom:calc(14px + env(safe-area-inset-bottom))}

  /* a pill only suits one short line; on a phone the message wraps, so it
     becomes an edge-to-edge banner sitting clear of the chef button + order bar */
  .toast{left:14px;right:14px;transform:none;max-width:none;
    border-radius:14px;padding:12px 16px;font-size:12.5px;
    bottom:calc(64px + env(safe-area-inset-bottom));animation:popFlat .2s ease}
  .toast-raised{bottom:calc(128px + env(safe-area-inset-bottom))}
}

@media(prefers-reduced-motion:reduce){.app *{animation:none !important;transition:none !important}}
`;
