// My Fridge 4주차: 기존 기능 유지 + localStorage 자동 저장과 소비기한 알림

let foods = [];
let shoppingItems = [];
let nextFoodId = 1;
let nextShoppingId = 1;
let editingFoodId = null;
let currentFilter = "all"; // all: 전체, soon: 임박, expired: 경과

const foodForm = document.querySelector("#food-form");
const nameInput = document.querySelector("#food-name");
const quantityInput = document.querySelector("#food-quantity");
const expiryInput = document.querySelector("#food-expiry");
const foodList = document.querySelector("#food-list");
const foodSubmit = document.querySelector("#food-submit");
const cancelEdit = document.querySelector("#cancel-edit");
const shoppingForm = document.querySelector("#shopping-form");
const shoppingName = document.querySelector("#shopping-name");
const shoppingList = document.querySelector("#shopping-list");

const sortSelect = document.querySelector("#sort-select");
const summaryButtons = document.querySelectorAll(".summary-box");
const filterNote = document.querySelector("#filter-note");
const expiryAlert = document.querySelector("#expiry-alert");

// 4주차: 브라우저에 식품 및 장보기 목록을 저장합니다.
const STORAGE_KEY = "myFridgeData";
let storageWarningShown = false;

function saveData() {
  const data = {
    foods: foods,
    shoppingItems: shoppingItems
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    if (!storageWarningShown) {
      alert("브라우저에 데이터를 저장할 수 없습니다. 저장 공간이나 브라우저 설정을 확인해 주세요.");
      storageWarningShown = true;
    }
  }
}

// 4주차: 페이지를 열 때 이전에 저장한 데이터를 불러옵니다.
function loadData() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return;

    const data = JSON.parse(savedData);
    if (Array.isArray(data.foods)) foods = data.foods;
    if (Array.isArray(data.shoppingItems)) shoppingItems = data.shoppingItems;

    // 기존 식품과 새로 등록하는 식품의 번호가 중복되지 않게 합니다.
    foods.forEach(function (food) {
      if (food.id >= nextFoodId) nextFoodId = food.id + 1;
    });
    shoppingItems.forEach(function (item) {
      if (item.id >= nextShoppingId) nextShoppingId = item.id + 1;
    });
  } catch (error) {
    alert("저장된 데이터를 불러오지 못했습니다. 브라우저 저장 데이터를 확인해 주세요.");
  }
}

// 4주차: 소비기한 임박·경과 식품이 있으면 안내 메시지를 표시합니다.
function updateExpiryAlert(soonCount, expiredCount) {
  if (soonCount === 0 && expiredCount === 0) {
    expiryAlert.hidden = true;
    return;
  }

  expiryAlert.hidden = false;
  expiryAlert.className = "expiry-alert";
  let message = "";

  if (expiredCount > 0) {
    expiryAlert.classList.add("alert-expired");
    message = "소비기한이 지난 식품이 " + expiredCount + "개 있습니다.";
  } else {
    expiryAlert.classList.add("alert-soon");
  }

  if (soonCount > 0) {
    if (message) message += " ";
    message += "소비기한이 임박한 식품이 " + soonCount + "개 있습니다.";
  }

  expiryAlert.textContent = message + " 냉장고 목록을 확인해 주세요.";
}

// 소비기한까지 남은 일수를 계산합니다.
// 시각을 제외하고 '날짜'만 비교하므로 D-day가 정확하게 나옵니다.
function getDaysRemaining(expiry) {
  const today = new Date();
  const todayDate = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const parts = expiry.split("-");
  const expiryDate = Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return Math.round((expiryDate - todayDate) / (1000 * 60 * 60 * 24));
}

// 상태: 소비기한 지남 / 0~3일 남음 / 4일 이상 남음
function getFoodStatus(expiry) {
  const days = getDaysRemaining(expiry);
  if (days < 0) return "expired";
  if (days <= 3) return "soon";
  return "normal";
}

function getDdayText(expiry) {
  const days = getDaysRemaining(expiry);
  if (days < 0) return "D+" + Math.abs(days);
  if (days === 0) return "D-day";
  return "D-" + days;
}

// 식품 등록 또는 수정: form 제출 이벤트
foodForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const name = nameInput.value.trim();
  const quantity = Number(quantityInput.value);
  const expiry = expiryInput.value;

  if (!name || !expiry || !Number.isInteger(quantity) || quantity < 1) {
    alert("식품명, 1개 이상의 수량, 소비기한을 올바르게 입력해 주세요.");
    return;
  }

  if (editingFoodId === null) {
    const food = { id: nextFoodId++, name, quantity, expiry };
    foods.push(food);
  } else {
    const food = foods.find(function (item) { return item.id === editingFoodId; });
    if (food) { food.name = name; food.quantity = quantity; food.expiry = expiry; }
  }
  resetFoodForm();
  saveData(); // 4주차: 등록·수정한 내용을 저장
  renderFoods();
});

function resetFoodForm() {
  editingFoodId = null;
  foodForm.reset();
  quantityInput.value = "1";
  foodSubmit.textContent = "식품 등록";
  cancelEdit.hidden = true;
}

cancelEdit.addEventListener("click", resetFoodForm);

function renderFoods() {
  // 전체 식품을 기준으로 요약 수치를 계산합니다.
  const soonCount = foods.filter(function (food) {
    return getFoodStatus(food.expiry) === "soon";
  }).length;
  const expiredCount = foods.filter(function (food) {
    return getFoodStatus(food.expiry) === "expired";
  }).length;

  document.querySelector("#total-count").textContent = foods.length;
  document.querySelector("#soon-count").textContent = soonCount;
  document.querySelector("#expired-count").textContent = expiredCount;
  updateExpiryAlert(soonCount, expiredCount);

  // 현재 선택한 필터 버튼을 표시합니다.
  summaryButtons.forEach(function (button) {
    const selected = button.dataset.filter === currentFilter;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  // 필터에 맞는 식품만 화면에 표시합니다.
  let visibleFoods = foods.filter(function (food) {
    if (currentFilter === "all") return true;
    return getFoodStatus(food.expiry) === currentFilter;
  });

  if (currentFilter === "soon") {
    filterNote.textContent = "소비기한이 오늘부터 3일 이내인 식품을 표시하고 있습니다.";
  } else if (currentFilter === "expired") {
    filterNote.textContent = "소비기한이 지난 식품을 표시하고 있습니다.";
  } else {
    filterNote.textContent = "전체 식품을 표시하고 있습니다.";
  }

  foodList.innerHTML = "";
  if (visibleFoods.length === 0) {
    foodList.className = "empty-state";
    const p = document.createElement("p");
    if (currentFilter === "soon") {
      p.textContent = "소비기한이 임박한 식품이 없습니다.";
    } else if (currentFilter === "expired") {
      p.textContent = "소비기한이 지난 식품이 없습니다.";
    } else {
      p.textContent = "아직 등록된 식품이 없습니다.";
    }
    foodList.appendChild(p);
    return;
  }

  foodList.className = "";
  // 2주차 정렬 기능을 유지합니다.
  visibleFoods = [...visibleFoods];
  if (sortSelect.value === "expiry-asc") {
    visibleFoods.sort(function (a, b) {
      return a.expiry.localeCompare(b.expiry);
    });
  } else if (sortSelect.value === "name-asc") {
    visibleFoods.sort(function (a, b) {
      return a.name.localeCompare(b.name, "ko");
    });
  } else if (sortSelect.value === "recent") {
    visibleFoods.sort(function (a, b) {
      return b.id - a.id;
    });
  }

  visibleFoods.forEach(function (food) {
    const row = document.createElement("div");
    row.className = "food-item";
    const info = document.createElement("div");
    const title = document.createElement("div");
    title.className = "item-name";
    title.textContent = food.name;
    const date = document.createElement("div");
    date.className = "item-meta";
    date.textContent = "소비기한: " + food.expiry;

    // 3주차: D-day 문구 및 색상 추가
    const dday = document.createElement("span");
    const status = getFoodStatus(food.expiry);
    dday.className = "dday-badge status-" + status;
    dday.textContent = getDdayText(food.expiry);
    info.append(title, date, dday);

    const actions = document.createElement("div");
    actions.className = "item-actions";
    const minus = createButton("−", "small-button", function () {
      if (food.quantity > 1) {
        food.quantity--;
        saveData(); // 4주차: 수량 변경 저장
        renderFoods();
      } else {
        alert("수량은 1개 이상이어야 합니다. 삭제하려면 삭제 버튼을 눌러주세요.");
      }
    });
    const number = document.createElement("span");
    number.className = "qty-number";
    number.textContent = food.quantity + "개";
    const plus = createButton("+", "small-button", function () {
      food.quantity++;
      saveData();
      renderFoods();
    });
    const edit = createButton("수정", "small-button", function () {
      editingFoodId = food.id;
      nameInput.value = food.name;
      quantityInput.value = food.quantity;
      expiryInput.value = food.expiry;
      foodSubmit.textContent = "수정 완료";
      cancelEdit.hidden = false;
      nameInput.focus();
    });
    const addToShopping = createButton("장보기로", "small-button", function () {
      addShoppingItem(food.name);
    });
    const remove = createButton("삭제", "small-button danger-button", function () {
      if (confirm(food.name + "을(를) 삭제할까요?")) {
        foods = foods.filter(function (item) { return item.id !== food.id; });
        if (editingFoodId === food.id) resetFoodForm();
        saveData(); // 4주차: 삭제 내용 저장
        renderFoods();
      }
    });
    actions.append(minus, number, plus, edit, addToShopping, remove);
    row.append(info, actions);
    foodList.appendChild(row);
  });
}

// 사용자 입력을 innerHTML에 넣지 않고 textContent를 이용해 표시합니다.
function createButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

shoppingForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const name = shoppingName.value.trim();
  if (!name) return;
  addShoppingItem(name);
  shoppingForm.reset();
  shoppingName.focus();
});

function addShoppingItem(name) {
  shoppingItems.push({ id: nextShoppingId++, name: name, checked: false });
  saveData(); // 4주차: 장보기 등록 저장
  renderShopping();
}

function renderShopping() {
  document.querySelector("#shopping-count").textContent = shoppingItems.length + "개";
  shoppingList.innerHTML = "";
  if (shoppingItems.length === 0) {
    shoppingList.className = "empty-state";
    const p = document.createElement("p");
    p.textContent = "장보기 목록이 비어 있습니다.";
    shoppingList.appendChild(p);
    return;
  }
  shoppingList.className = "";
  shoppingItems.forEach(function (item) {
    const row = document.createElement("div");
    row.className = "shopping-item";
    const label = document.createElement("label");
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = item.checked;
    check.addEventListener("change", function () {
      item.checked = check.checked;
      saveData(); // 4주차: 구매 완료 체크 저장
      renderShopping();
    });
    const text = document.createElement("span");
    text.textContent = item.name;
    if (item.checked) text.className = "is-checked";
    label.append(check, text);
    const remove = createButton("삭제", "small-button danger-button", function () {
      shoppingItems = shoppingItems.filter(function (entry) { return entry.id !== item.id; });
      saveData(); // 4주차: 장보기 삭제 저장
      renderShopping();
    });
    row.append(label, remove);
    shoppingList.appendChild(row);
  });
}

sortSelect.addEventListener("change", function () {
  renderFoods();
});

// 3주차: 냉장고 현황 버튼으로 목록을 전환합니다.
summaryButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    currentFilter = button.dataset.filter;
    renderFoods();
  });
});

// 4주차: 저장한 내용을 복원한 다음 화면을 그립니다.
loadData();
renderFoods();
renderShopping();
