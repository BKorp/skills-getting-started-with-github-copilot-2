document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  function attachDeleteHandler(btn, activityCard) {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = btn.dataset.email;
      const activityName = btn.dataset.activity;
      try {
        const res = await fetch(`/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
        const payload = await res.json();
        if (res.ok) {
          const li = btn.closest('.participant-item');
          if (li) li.remove();

          const countSpan = activityCard.querySelector('.participant-count');
          const spotsSpan = activityCard.querySelector('.spots-left');
          const participantsList = activityCard.querySelectorAll('.participants .participant-item');
          if (countSpan) countSpan.textContent = `(${participantsList.length})`;
          if (spotsSpan) spotsSpan.textContent = parseInt(spotsSpan.textContent, 10) + 1;

          messageDiv.textContent = payload.message || 'Participant removed';
          messageDiv.className = 'success';
        } else {
          messageDiv.textContent = payload.detail || 'Failed to remove participant';
          messageDiv.className = 'error';
        }
      } catch (err) {
        console.error('Error removing participant:', err);
        messageDiv.textContent = 'Failed to remove participant';
        messageDiv.className = 'error';
      }
      messageDiv.classList.remove('hidden');
      setTimeout(() => messageDiv.classList.add('hidden'), 4000);
    });
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> <span class="spots-left">${spotsLeft}</span> spots left</p>
          <div class="participants-block">
            <p><strong>Participants</strong> <span class="participant-count">(${details.participants.length})</span></p>
            <ul class="participants">
              ${details.participants.map(p => `<li class="participant-item"><span class="participant-email">${p}</span><button class="delete-btn" data-activity="${name}" data-email="${p}" aria-label="Remove ${p}">✕</button></li>`).join("")}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);
        activityCard.setAttribute('data-activity', name);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);

        // Attach delete handlers for participants in this card
        const deleteButtons = activityCard.querySelectorAll('.delete-btn');
        deleteButtons.forEach(btn => attachDeleteHandler(btn, activityCard));
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

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
        signupForm.reset();
        // Update the activity card in-place so the user sees the new participant
        const activityCard = document.querySelector(`[data-activity="${activity}"]`);
        if (activityCard) {
          const participantsUl = activityCard.querySelector('.participants');
          // avoid duplicate in UI
          const already = Array.from(participantsUl.querySelectorAll('.participant-email')).some(s => s.textContent === email);
          if (!already) {
            const li = document.createElement('li');
            li.className = 'participant-item';
            const span = document.createElement('span');
            span.className = 'participant-email';
            span.textContent = email;
            const btn = document.createElement('button');
            btn.className = 'delete-btn';
            btn.dataset.activity = activity;
            btn.dataset.email = email;
            btn.setAttribute('aria-label', `Remove ${email}`);
            btn.textContent = '✕';
            li.appendChild(span);
            li.appendChild(btn);
            participantsUl.appendChild(li);
            attachDeleteHandler(btn, activityCard);

            const countSpan = activityCard.querySelector('.participant-count');
            const spotsSpan = activityCard.querySelector('.spots-left');
            const participantsList = participantsUl.querySelectorAll('.participant-item');
            if (countSpan) countSpan.textContent = `(${participantsList.length})`;
            if (spotsSpan) spotsSpan.textContent = Math.max(0, parseInt(spotsSpan.textContent, 10) - 1);
          }
        }
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
