gsap.registerPlugin(ScrollTrigger);

const canvas = document.getElementById("sportCanvas");
const context = canvas.getContext("2d");

const sport = canvas.dataset.sport;
const frameCount = 200;
const images = [];
const currentFrame = index => `frames/${sport}/frame${String(index).padStart(4, '0')}.jpg`;

for (let i = 1; i <= frameCount; i++) {
  const img = new Image();
  img.src = currentFrame(i);
  images.push(img);
}

images[0].onload = () => {
  context.drawImage(images[0], 0, 0, canvas.width, canvas.height);
};

const scrollObj = { frame: 0 };

gsap.to(scrollObj, {
  frame: frameCount - 1,
  snap: "frame",
  ease: "none",
  scrollTrigger: {
    scrub: 1,
    trigger: canvas,
    start: "top top",
    end: sport === "football" ? `+=${window.innerHeight * 2}` : `+=${window.innerHeight * 5}`,
    pin: true
  },
  onUpdate: () => {
    const img = images[scrollObj.frame];
    if (img && img.complete) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  }
});

if (sport === "football") {
  showTextPercent("text1", 0.00, 0.20);
  showTextPercent("text2", 0.21, 0.40);
} else {
  showTextPercent("text1", 0.00, 0.15);
  showTextPercent("text2", 0.16, 0.30);
  showTextPercent("text3", 0.31, 0.50);
  showTextPercent("text4", 0.51, 0.70);
  showTextPercent("text5", 0.71, 0.85);
}

function showTextPercent(id, startPercent, endPercent) {
  ScrollTrigger.create({
    trigger: canvas,
    start: "top top",
    end: `+=${window.innerHeight * 5}`,
    scrub: true,
    onUpdate: self => {
      const progress = self.progress;
      const el = document.getElementById(id);
      if (el) {
        el.style.opacity = (progress >= startPercent && progress <= endPercent) ? 1 : 0;
      }
    }
  });
}

const textOverlay = document.getElementById("textOverlay");
ScrollTrigger.create({
  trigger: canvas,
  start: "top top",
  end: `+=${window.innerHeight * 5}`,
  onEnter: () => textOverlay.style.display = "flex",
  onLeave: () => textOverlay.style.display = "none",
  onEnterBack: () => textOverlay.style.display = "flex",
  onLeaveBack: () => textOverlay.style.display = "none"
});

const selectedSlots = new Set();
const pricePerHour = 1100;

function formatHour(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}${suffix}`;
}

function formatDateLabel(dateObj) {
  return dateObj.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

function populateDateDropdown() {
  const dateSelect = document.getElementById("dateSelector");
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);
    const option = document.createElement("option");
    option.value = futureDate.toISOString().split("T")[0];
    option.textContent = i === 0 ? "Today" : formatDateLabel(futureDate);
    dateSelect.appendChild(option);
  }

  dateSelect.addEventListener("change", () => {
    selectedSlots.clear();
    generateTimeSlots();
    hidePaymentPopup();
  });
}

function generateTimeSlots(startHour = 6, endHour = 24) {
  const wrapper = document.getElementById("slotsWrapper");
  wrapper.innerHTML = "";
  const date = document.getElementById("dateSelector").value;

  const bookedSlots = {
    "2025-07-24": ["09", "15"],
    "2025-07-25": ["10", "14"]
  };

  const bookedForDate = bookedSlots[date] || [];

  for (let hour = startHour; hour < endHour; hour++) {
    const hourStr = hour.toString().padStart(2, "0");
    const slot = document.createElement("div");
    const label = `${formatHour(hour)} - ${formatHour(hour + 1)}`;

    slot.className = "slot";
    slot.dataset.hour = hourStr;
    slot.textContent = label;

    if (bookedForDate.includes(hourStr)) {
      slot.classList.add("booked");
    } else {
      slot.addEventListener("click", () => {
        if (slot.classList.contains("selected")) {
          selectedSlots.delete(hourStr);
          slot.classList.remove("selected");
        } else {
          selectedSlots.add(hourStr);
          slot.classList.add("selected");
        }

        if (selectedSlots.size > 0) {
          showPaymentPopup();
        } else {
          hidePaymentPopup();
        }
      });
    }

    wrapper.appendChild(slot);
  }
}

function showPaymentPopup() {
  const modal = document.getElementById("paymentModal");
  const timeText = document.getElementById("selectedTime");
  const priceText = document.getElementById("totalPrice");

  const sorted = Array.from(selectedSlots).sort((a, b) => a - b);
  const start = parseInt(sorted[0]);
  const end = parseInt(sorted[sorted.length - 1]) + 1;

  const timeLabel = `${formatHour(start)} to ${formatHour(end)}`;
  const total = selectedSlots.size * pricePerHour;

  timeText.textContent = timeLabel;
  priceText.textContent = total;
  modal.style.display = "flex";
}

function hidePaymentPopup() {
  document.getElementById("paymentModal").style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
  populateDateDropdown();
  generateTimeSlots();

  document.querySelector(".close-btn").addEventListener("click", hidePaymentPopup);

  document.getElementById("confirmPayment").addEventListener("click", () => {
    const sorted = Array.from(selectedSlots).sort((a, b) => a - b);
    const total = selectedSlots.size * pricePerHour;
    const sport = document.getElementById("sportCanvas").dataset.sport;
    window.location.href = `payment.html?sport=${sport}&amount=${total}`;
  });
});