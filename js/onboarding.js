let currentStep = 1;
let selectedAvatarFile = null;

document.addEventListener('DOMContentLoaded', () => {
  initOnboardingForm();
});

function initOnboardingForm() {
  const onboardingForm = document.getElementById('onboarding-form');
  const avatarInput = document.getElementById('avatar-input');
  const targetTypeRadios = document.querySelectorAll('input[name="target_type"]');

  // Avatar Selection Preview
  avatarInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      selectedAvatarFile = file;
      const reader = new FileReader();
      reader.onload = (evt) => {
        document.getElementById('avatar-preview').innerHTML = `<img src="${evt.target.result}" alt="Preview">`;
      };
      reader.readAsDataURL(file);
    }
  });

  // Toggle Class vs Competitive Fields
  targetTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const isClass = e.target.value === 'class';
      document.getElementById('class-select-group').classList.toggle('hidden', !isClass);
      document.getElementById('board-select-group').classList.toggle('hidden', !isClass);
      document.getElementById('exam-select-group').classList.toggle('hidden', isClass);
    });
  });

  // Step Navigation Buttons
  document.querySelectorAll('.next-step-btn').forEach(btn => {
    btn.addEventListener('click', () => navigateStep(1));
  });

  document.querySelectorAll('.prev-step-btn').forEach(btn => {
    btn.addEventListener('click', () => navigateStep(-1));
  });

  // Final Submission
  onboardingForm?.addEventListener('submit', handleOnboardingSubmit);
}

function navigateStep(direction) {
  const nameInput = document.getElementById('onboarding-name');
  if (currentStep === 1 && direction === 1 && !nameInput.value.trim()) {
    alert("Please enter your name.");
    return;
  }

  currentStep += direction;
  updateOnboardingUI();
}

function updateOnboardingUI() {
  document.querySelectorAll('.onboarding-step').forEach(step => {
    step.classList.toggle('active', parseInt(step.dataset.step) === currentStep);
  });
  
  const progressBar = document.getElementById('onboarding-progress-bar');
  if (progressBar) {
    progressBar.style.width = `${(currentStep / 3) * 100}%`;
  }
}

async function handleOnboardingSubmit(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('onboarding-submit-btn');
  const errorBox = document.getElementById('onboarding-error');
  
  submitBtn.disabled = true;
  errorBox.classList.add('hidden');

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No authenticated user found.");

    let avatarUrl = null;

    // 1. Upload Avatar to Supabase Storage if provided
    if (selectedAvatarFile) {
      const fileExt = selectedAvatarFile.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, selectedAvatarFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      avatarUrl = publicUrlData.publicUrl;
    }

    // 2. Gather Profile Form Data
    const targetType = document.querySelector('input[name="target_type"]:checked').value;
    const targetValue = targetType === 'class' 
      ? document.getElementById('target-class').value 
      : document.getElementById('target-exam').value;
    
    const boardValue = targetType === 'class' ? document.getElementById('target-board').value : null;

    const profileData = {
      id: user.id,
      name: document.getElementById('onboarding-name').value.trim(),
      avatar_url: avatarUrl,
      target_type: targetType,
      target_value: targetValue,
      board: boardValue,
      medium: document.getElementById('study-medium').value,
      preferred_language: document.getElementById('pref-language').value,
      onboarding_completed: true,
      updated_at: new Date()
    };

    // 3. Upsert to Supabase 'profiles' table
    const { error: dbError } = await supabase.from('profiles').upsert(profileData);
    if (dbError) throw dbError;

    // 4. Complete Onboarding & Open Home
    document.getElementById('onboarding-container').classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');
    
    // Load home user details
    loadUserProfile(profileData);

  } catch (err) {
    errorBox.textContent = getFriendlyErrorMessage(err);
    errorBox.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
  }
}

// Function to update Home Screen with user details
function loadUserProfile(profile) {
  if (!profile) return;

  const nameEl = document.getElementById('home-user-name');
  const tagEl = document.getElementById('home-user-tag');
  const avatarImg = document.getElementById('home-user-avatar');
  const avatarPlaceholder = document.getElementById('home-avatar-placeholder');
  const progressTarget = document.getElementById('home-progress-target');

  if (nameEl) nameEl.textContent = `Hello, ${profile.name}!`;
  
  let tagText = profile.target_value;
  if (profile.board) tagText += ` • ${profile.board}`;
  if (profile.medium) tagText += ` (${profile.medium})`;
  
  if (tagEl) tagEl.textContent = tagText;
  if (progressTarget) progressTarget.textContent = `${profile.target_value} Syllabus`;

  if (profile.avatar_url) {
    avatarImg.src = profile.avatar_url;
    avatarImg.classList.remove('hidden');
    avatarPlaceholder.classList.add('hidden');
  } else {
    avatarPlaceholder.textContent = profile.name.charAt(0).toUpperCase();
    avatarPlaceholder.classList.remove('hidden');
    avatarImg.classList.add('hidden');
  }
  }

