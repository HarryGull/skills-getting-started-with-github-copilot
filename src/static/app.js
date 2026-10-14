document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function renderParticipants(participantsSection, participants) {
    const participantsHeading = document.createElement("h5");
    participantsHeading.textContent = "Participants";
    participantsSection.replaceChildren(participantsHeading);

    if (participants.length > 0) {
      const participantsList = document.createElement("ul");
      participants.forEach((participant) => {
        const listItem = document.createElement("li");

        const participantEmail = document.createElement("span");
        participantEmail.textContent = participant;
        listItem.appendChild(participantEmail);

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "remove-participant";
        removeButton.dataset.email = participant;
        removeButton.setAttribute("aria-label", `Unregister ${participant}`);
        removeButton.title = `Unregister ${participant}`;
        removeButton.innerHTML = `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v6m4-6v6" />
          </svg>
        `;
        listItem.appendChild(removeButton);
        participantsList.appendChild(listItem);
      });
      participantsSection.appendChild(participantsList);
    } else {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "participants-empty";
      emptyMessage.textContent = "No participants yet";
      participantsSection.appendChild(emptyMessage);
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.status}`);
      }
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.replaceChildren(new Option("-- Select an activity --", ""));

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.dataset.activity = name;

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants";
        renderParticipants(participantsSection, details.participants);
        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".remove-participant");
    if (!removeButton) {
      return;
    }

    const activityCard = removeButton.closest(".activity-card");
    const activity = activityCard.dataset.activity;
    const email = removeButton.dataset.email;
    const query = new URLSearchParams({ email });
    removeButton.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?${query}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Unable to unregister participant");
      }

      renderParticipants(
        activityCard.querySelector(".participants"),
        result.participants
      );
      activityCard.querySelector(".availability").innerHTML =
        `<strong>Availability:</strong> ${result.spots_left} spots left`;
      messageDiv.textContent = result.message;
      messageDiv.className = "success";
    } catch (error) {
      removeButton.disabled = false;
      messageDiv.textContent = error.message || "Failed to unregister participant. Please try again.";
      messageDiv.className = "error";
      console.error("Error unregistering participant:", error);
    }

    messageDiv.classList.remove("hidden");
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        const activityCard = Array.from(activitiesList.children).find(
          (card) => card.dataset.activity === activity
        );
        if (activityCard) {
          renderParticipants(
            activityCard.querySelector(".participants"),
            result.participants
          );
          activityCard.querySelector(".availability").innerHTML =
            `<strong>Availability:</strong> ${result.spots_left} spots left`;
        }
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
