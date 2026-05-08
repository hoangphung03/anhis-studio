const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const form = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");
const serviceSelect = document.querySelector("[data-service-select]");
const calendarTitle = document.querySelector("[data-calendar-title]");
const calendarGrid = document.querySelector("[data-calendar-grid]");
const prevMonthButton = document.querySelector("[data-prev-month]");
const nextMonthButton = document.querySelector("[data-next-month]");
const selectedDateInput = document.querySelector("[data-selected-date]");
const selectedTimeInput = document.querySelector("[data-selected-time]");
const timeSlots = document.querySelector("[data-time-slots]");
const bookingSummary = document.querySelector("[data-booking-summary]");
const bookingStorageKey = "anhis-studio-bookings";

const today = new Date();
today.setHours(0, 0, 0, 0);

let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = "";
let selectedTime = "";

const updateHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 24);
};

const formatDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (value) => {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
};

const getBookings = () => {
  try {
    return JSON.parse(localStorage.getItem(bookingStorageKey)) || [];
  } catch {
    return [];
  }
};

const saveBookings = (bookings) => {
  localStorage.setItem(bookingStorageKey, JSON.stringify(bookings));
};

const getTimeValues = () => {
  return [...timeSlots.querySelectorAll("button[data-time]")].map((button) => button.dataset.time);
};

const isSlotBooked = (date, time) => {
  return getBookings().some((booking) => booking.date === date && booking.time === time);
};

const isDayFullyBooked = (date) => {
  return getTimeValues().every((time) => isSlotBooked(date, time));
};

const updateBookingSummary = () => {
  const service = serviceSelect.value;
  const dateText = formatDisplayDate(selectedDate);

  if (!service || !selectedDate || !selectedTime) {
    bookingSummary.textContent = "Bitte Leistung, Tag und Uhrzeit auswählen.";
    return;
  }

  bookingSummary.textContent = `${service} am ${dateText} um ${selectedTime} Uhr.`;
};

const updateTimeSlots = () => {
  timeSlots.querySelectorAll("button[data-time]").forEach((button) => {
    const time = button.dataset.time;
    const booked = Boolean(selectedDate && isSlotBooked(selectedDate, time));

    button.disabled = !selectedDate || booked;
    button.classList.toggle("is-booked", booked);
    button.classList.toggle("is-selected", selectedTime === time && !booked);
    button.textContent = booked ? `${time} besetzt` : time;
  });

  if (selectedTime && isSlotBooked(selectedDate, selectedTime)) {
    selectedTime = "";
    selectedTimeInput.value = "";
  }
};

const renderCalendar = () => {
  calendarGrid.innerHTML = "";
  calendarTitle.textContent = new Intl.DateTimeFormat("de-DE", {
    month: "long",
    year: "numeric",
  }).format(visibleMonth);

  const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const lastDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);
  const leadingEmptyDays = (firstDay.getDay() + 6) % 7;

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    const empty = document.createElement("span");
    empty.className = "calendar-day is-empty";
    calendarGrid.append(empty);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
    const value = formatDateValue(date);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-day";
    button.textContent = String(day);
    button.dataset.date = value;
    button.setAttribute("aria-label", formatDisplayDate(value));

    const isSunday = date.getDay() === 0;
    const isPast = date < today;
    const isFullyBooked = isDayFullyBooked(value);

    button.disabled = isSunday || isPast || isFullyBooked;
    button.classList.toggle("is-fully-booked", isFullyBooked);

    if (isFullyBooked) {
      button.setAttribute("aria-label", `${formatDisplayDate(value)} ausgebucht`);
    }

    if (value === selectedDate) {
      button.classList.add("is-selected");
    }

    button.addEventListener("click", () => {
      selectedDate = value;
      selectedTime = "";
      selectedDateInput.value = value;
      selectedTimeInput.value = "";
      formStatus.textContent = "";
      renderCalendar();
      updateTimeSlots();
      updateBookingSummary();
    });

    calendarGrid.append(button);
  }

  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  prevMonthButton.disabled = visibleMonth <= currentMonth;
};

updateHeader();
renderCalendar();
updateTimeSlots();
updateBookingSummary();

window.addEventListener("scroll", updateHeader, { passive: true });

menuToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    nav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

prevMonthButton.addEventListener("click", () => {
  visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
  renderCalendar();
});

nextMonthButton.addEventListener("click", () => {
  visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
  renderCalendar();
});

serviceSelect.addEventListener("change", () => {
  formStatus.textContent = "";
  updateBookingSummary();
});

timeSlots.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-time]");
  if (!button || button.disabled) return;

  selectedTime = button.dataset.time;

  if (isSlotBooked(selectedDate, selectedTime)) {
    selectedTime = "";
    selectedTimeInput.value = "";
    formStatus.textContent = "Diese Uhrzeit ist bereits besetzt.";
    updateTimeSlots();
    updateBookingSummary();
    return;
  }

  selectedTimeInput.value = selectedTime;
  formStatus.textContent = "";
  updateTimeSlots();
  updateBookingSummary();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!serviceSelect.value || !selectedDate || !selectedTime) {
    formStatus.textContent = "Bitte wähle eine Leistung, einen Tag und eine Uhrzeit aus.";
    return;
  }

  if (isSlotBooked(selectedDate, selectedTime)) {
    formStatus.textContent = "Diese Uhrzeit ist inzwischen besetzt. Bitte wähle eine andere Uhrzeit.";
    updateTimeSlots();
    return;
  }

  const data = new FormData(form);
  const name = data.get("name");
  const service = data.get("service");
  const dateText = formatDisplayDate(data.get("date"));
  const time = data.get("time");
  const bookings = getBookings();

  bookings.push({
    name,
    service,
    date: selectedDate,
    time,
    createdAt: new Date().toISOString(),
  });
  saveBookings(bookings);

  formStatus.textContent = `Danke, ${name}. Dein Termin für ${service} am ${dateText} um ${time} Uhr ist gebucht.`;
  form.reset();
  selectedDate = "";
  selectedTime = "";
  selectedDateInput.value = "";
  selectedTimeInput.value = "";
  renderCalendar();
  updateTimeSlots();
  updateBookingSummary();
});
