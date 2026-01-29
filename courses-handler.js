// Courses Page Handler
import { AuthService } from './auth.js'
import { CourseService } from './course-service.js'
import { createCheckoutSession, redirectToCheckout } from './stripe-config.js'

let currentUser = null
let courses = []

// Update navigation for authenticated user
async function updateNavForAuth() {
  const authNavItem = document.getElementById('authNavItem')
  if (authNavItem) {
    const { user } = await AuthService.getCurrentUser()
    if (user) {
      authNavItem.innerHTML = `
        <a href="#" id="signOutNavBtn" class="btn btn-signin">Sign Out</a>
      `
      const signOutBtn = document.getElementById('signOutNavBtn')
      if (signOutBtn) {
        signOutBtn.addEventListener('click', async (e) => {
          e.preventDefault()
          const result = await AuthService.signOut()
          if (result.success) {
            window.location.href = 'index.html'
          }
        })
      }
    } else {
      // User is not logged in, show Sign In
      authNavItem.innerHTML = `
        <a href="signin.html" class="btn btn-signin">Sign In</a>
      `
    }
  }
}

// Initialize courses page
async function initCoursesPage() {
  // Check if user is logged in
  const { user } = await AuthService.getCurrentUser()
  currentUser = user
  
  // Update navigation menu based on auth status
  await updateNavForAuth()
  
  // Listen for auth state changes to update navigation
  AuthService.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
      // Update current user
      currentUser = session?.user || null
      // Update navigation
      updateNavForAuth()
    }
  })
  
  // Load courses
  await loadCourses()
}

// Load all courses
async function loadCourses() {
  try {
    const result = await CourseService.getAllCourses()
    
    if (result.success && result.courses && result.courses.length > 0) {
      courses = result.courses
      // Sort courses: free lesson first, then others
      const sortedCourses = [...result.courses].sort((a, b) => {
        // Free course (bundle_name === 'free') should be first
        if (a.bundle_name === 'free' && b.bundle_name !== 'free') return -1
        if (a.bundle_name !== 'free' && b.bundle_name === 'free') return 1
        // Otherwise maintain original order
        return 0
      })
      renderCourses(sortedCourses)
    } else {
      console.warn('No courses found in database or database not configured:', result.error || 'No courses returned')
      // Fallback to static courses if database fails
      renderStaticCourses()
    }
  } catch (error) {
    console.error('Error loading courses:', error)
    // Fallback to static courses if database fails
    renderStaticCourses()
  }
}

// Render courses dynamically
function renderCourses(coursesData) {
  const coursesList = document.querySelector('.courses-list')
  const loadingMessage = document.getElementById('loadingMessage')
  const staticCourses = document.getElementById('staticCourses')
  
  if (!coursesList) return
  
  // Hide loading message
  if (loadingMessage) loadingMessage.style.display = 'none'
  
  if (coursesData && coursesData.length > 0) {
    // Hide static courses and show database courses
    if (staticCourses) staticCourses.style.display = 'none'
    
    // Clear and render database courses
    const existingCards = coursesList.querySelectorAll('.course-detail-card:not(#staticCourses .course-detail-card)')
    existingCards.forEach(card => card.remove())
    
    coursesData.forEach(course => {
      const card = createCourseCard(course)
      coursesList.appendChild(card)
    })
  } else {
    // If no courses in database, show static courses
    if (staticCourses) {
      staticCourses.style.display = 'block'
      // Also add Hello Starter Bundle if not already there
      addHelloStarterIfNeeded()
    } else {
      renderStaticCourses()
    }
  }
}

// Create course card
function createCourseCard(course) {
  const card = document.createElement('div')
  card.className = 'course-detail-card'
  if (course.bundle_name === 'world') {
    card.classList.add('bundle')
    card.id = 'world-bundle'
  }
  
  const price = course.price === 0 ? 'Free' : `€${course.price.toFixed(2)}`
  
  card.innerHTML = `
    <div class="course-detail-header">
      <div class="course-level-badge ${getBadgeClass(course.bundle_name)}">${getBadgeText(course.bundle_name)}</div>
      <h2>${course.name}</h2>
    </div>
    <div class="course-detail-content">
      <div class="course-info">
        <div class="info-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          <span>${course.lesson_count} ${course.lesson_count === 1 ? 'Lesson' : 'Lessons'}</span>
        </div>
        <div class="info-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>Lifetime Access</span>
        </div>
      </div>
      <div class="course-description">
        ${getCourseDetails(course)}
      </div>
      <div class="course-price">
        <span class="price">${price}</span>
        ${getPurchaseButton(course)}
      </div>
    </div>
  `
  
  // Add event listener to purchase button
  const purchaseBtn = card.querySelector('.purchase-btn')
  if (purchaseBtn) {
    purchaseBtn.addEventListener('click', (e) => {
      e.preventDefault()
      handlePurchase(course)
    })
  }
  
  // Add event listener to "Start Free Lesson" button to force signup for unregistered users
  const startFreeLessonBtn = card.querySelector('a[href*="course-player.html"]')
  if (startFreeLessonBtn && startFreeLessonBtn.textContent.includes('Start Free Lesson')) {
    startFreeLessonBtn.addEventListener('click', async (e) => {
      // Check if user is logged in
      const { user } = await AuthService.getCurrentUser()
      if (!user) {
        e.preventDefault()
        // Force redirect to signup page
        window.location.href = 'signup.html'
        return false
      }
      // If user is logged in, allow normal navigation
    })
  }
  
  // Add tab functionality
  const tabButtons = card.querySelectorAll('.tab-btn')
  const tabPanes = card.querySelectorAll('.tab-pane')
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab')
      
      // Remove active class from all buttons and panes in this card
      tabButtons.forEach(btn => btn.classList.remove('active'))
      tabPanes.forEach(pane => pane.classList.remove('active'))
      
      // Add active class to clicked button and corresponding pane
      button.classList.add('active')
      const targetPane = card.querySelector(`#${tabId}`)
      if (targetPane) {
        targetPane.classList.add('active')
      }
    })
  })
  
  return card
}

// Get badge class
function getBadgeClass(bundleName) {
  const badges = {
    'free': 'beginner',
    'hello_starter': 'beginner',
    'jumpstart': 'beginner',
    'grow_go': 'intermediate',
    'climb_kit': 'intermediate',
    'keep_going': 'intermediate',
    'elevate_essentials': 'advanced',
    'world': 'bundle-badge'
  }
  return badges[bundleName] || 'beginner'
}

// Get badge text
function getBadgeText(bundleName) {
  const texts = {
    'free': 'Free',
    'hello_starter': 'Beginner',
    'jumpstart': 'Beginner',
    'grow_go': 'Intermediate',
    'climb_kit': 'Intermediate',
    'keep_going': 'Intermediate',
    'elevate_essentials': 'Advanced',
    'world': 'Best Value'
  }
  return texts[bundleName] || 'Course'
}

// Get course details/learning points
function getCourseDetails(course) {
  const courseId = course.id || 'course-' + Math.random().toString(36).substr(2, 9)
  const overviewId = `overview-${courseId}`
  const curriculumId = `curriculum-${courseId}`
  
  // Special details for Hello Starter Bundle
  if (course.bundle_name === 'hello_starter') {
    return `
      <div class="course-tabs">
        <div class="tab-buttons">
          <button class="tab-btn active" data-tab="${overviewId}">Overview</button>
          <button class="tab-btn" data-tab="${curriculumId}">Curriculum</button>
        </div>
        <div class="tab-content">
          <div class="tab-pane active" id="${overviewId}">
            <p>This bundle focuses on <strong>essential greetings, introductions, and foundational grammar</strong> to get you started with Portuguese. Perfect for absolute beginners who want to build a solid foundation.</p>
            <h4>In this bundle, you will:</h4>
      <ul>
        <li>Essential greetings and introductions</li>
        <li>Adjectives - describing people, places, and things</li>
        <li>Prepositions - understanding spatial and temporal relationships</li>
        <li>Basic conversation skills</li>
        <li>Practical vocabulary for travel and daily life</li>
      </ul>
            <p>This bundle is perfect for learners who want to <strong>start their Portuguese journey</strong> with confidence and build a strong foundation for future learning.</p>
          </div>
          <div class="tab-pane" id="${curriculumId}">
            <h4>Course Curriculum</h4>
            <ul>
              <li>Lesson 1 - Personal Names, Countries & Adjectives</li>
              <li>Lesson 2 - Adjectives & Everyday Vocabulary (É, E, Mas) – Building Short Sentences</li>
              <li>Lesson 3 - Greetings & First Conversations (É / Está, Tudo bem?, Como está?)</li>
              <li>Lesson 4 - Talking About Time & Daily Context (Hoje, Amanhã, Counting to 12, Temos/Tenho)</li>
              <li>Lesson 5 - Places & Drinks Vocabulary (In, On, At – Café, Bica, Caneca, Fino, Cerveja)</li>
              <li>Lesson 6 - Days of the Week & Expressing Existence (Há – There Is / There Are)</li>
              <li>Lesson 7 - Months & Seasons of the Year</li>
              <li>Lesson 8 - Demonstratives & Everyday Expressions (Este, Esta, Isto, Chega, Não chega, Quero mais)</li>
            </ul>
          </div>
        </div>
      </div>
    `
  }
  
  // Elevate Essentials Bundle
  if (course.bundle_name === 'elevate_essentials') {
    return `
      <div class="course-tabs">
        <div class="tab-buttons">
          <button class="tab-btn active" data-tab="${overviewId}">Overview</button>
          <button class="tab-btn" data-tab="${curriculumId}">Curriculum</button>
        </div>
        <div class="tab-content">
          <div class="tab-pane active" id="${overviewId}">
            <p>This bundle focuses on <strong>past tenses</strong> and practical vocabulary around <strong>properties and places</strong>. You will gain the skills to describe past events, narrate experiences, talk about homes, objects, and locations.</p>
            <h4>In this bundle, you will:</h4>
            <ul>
              <li>Master the main <strong>past tenses</strong> (pretérito perfeito, imperfeito, mais-que-perfeito) for speaking about completed and ongoing past actions.</li>
              <li>Learn essential vocabulary for <strong>properties, rooms, and objects</strong>.</li>
              <li>Form sentences to describe what happened, where, and how things were.</li>
              <li>Communicate confidently about past experiences and everyday situations.</li>
            </ul>
            <p>This bundle is perfect for learners who want to <strong>elevate their Portuguese</strong>, combining grammar mastery with practical vocabulary for real-life use.</p>
          </div>
          <div class="tab-pane" id="${curriculumId}">
            <h4>Course Curriculum</h4>
            <ul>
              <li>Lesson 1 - Tourism and holidays in Portugal</li>
              <li>Lesson 2 - Ask and discuss prices in Portuguese</li>
              <li>Lesson 3 - Properties, homes, and objects in Portuguese</li>
              <li>Lesson 4 - Recent events and experiences</li>
              <li>Lesson 5 - Past habits, routines, and events</li>
              <li>Lesson 6 - The versatile Portuguese verb "poder"</li>
              <li>Lesson 7 - Jobs, professions, and making appointments in Portuguese</li>
              <li>Lesson 8 - Shopping at a supermarket</li>
            </ul>
          </div>
        </div>
      </div>
    `
  }
  
  // Keep Going Bundle
  if (course.bundle_name === 'keep_going') {
    return `
      <div class="course-tabs">
        <div class="tab-buttons">
          <button class="tab-btn active" data-tab="${overviewId}">Overview</button>
          <button class="tab-btn" data-tab="${curriculumId}">Curriculum</button>
        </div>
        <div class="tab-content">
          <div class="tab-pane active" id="${overviewId}">
            <p>This bundle is for learners who have understand and completed the basics and want to <strong>expand their vocabulary, grammar, and conversation skills</strong> in Portuguese. Each lesson builds on what you already know, helping you communicate more naturally and confidently in a variety of everyday situations.</p>
            <h4>In this bundle, you will:</h4>
            <ul>
              <li>Strengthen your understanding of verbs, tenses, and sentence structures.</li>
              <li>Expand vocabulary around topics like food, travel, animals, clothing, and daily life.</li>
              <li>Learn practical phrases, idiomatic expressions, and polite forms of communication.</li>
              <li>Practice listening, speaking, and forming sentences to speak Portuguese fluently.</li>
            </ul>
            <p>This bundle is perfect for motivated learners who want to <strong>keep progressing</strong> and gain confidence in real-world conversations.</p>
          </div>
          <div class="tab-pane" id="${curriculumId}">
            <h4>Course Curriculum</h4>
            <ul>
              <li>Lesson 1 - Location and time</li>
              <li>Lesson 2 - Daily routines, appointments, and travel</li>
              <li>Lesson 3 - Talk about plans, intentions, and upcoming events (future tense)</li>
              <li>Lesson 4 - Going to places</li>
              <li>Lesson 5 - Express hypothetical situations, wishes, and polite requests</li>
              <li>Lesson 6 - Vocabulary and phrases for traveling</li>
              <li>Lesson 7 - Communicate effectively in real-life airport scenarios</li>
              <li>Lesson 8 - Understand and respond to clues in Portuguese</li>
            </ul>
          </div>
        </div>
      </div>
    `
  }
  
  // Jumpstart Bundle
  if (course.bundle_name === 'jumpstart') {
    return `
      <div class="course-tabs">
        <div class="tab-buttons">
          <button class="tab-btn active" data-tab="${overviewId}">Overview</button>
          <button class="tab-btn" data-tab="${curriculumId}">Curriculum</button>
        </div>
        <div class="tab-content">
          <div class="tab-pane active" id="${overviewId}">
            <p>This course provides a structured and practical introduction to Portuguese through The Jumpstart Bundle, a focused sequence of eight lessons designed to build real-world communication skills from day one. Learners are guided through essential foundations such as gender and personal forms, the verbs ser and estar, core sentence structures, food and drink vocabulary, articles and contractions, and polite requests. The course then progresses to everyday scenarios, including ordering food and asking questions, ensuring students gain the confidence to understand, speak, and use Portuguese naturally in daily situations.</p>
          </div>
          <div class="tab-pane" id="${curriculumId}">
            <h4>Course Curriculum</h4>
            <ul>
              <li>Lesson 1 - Gender and Persons</li>
              <li>Lesson 2 - The Verb "To Be" (Ser and Estar)</li>
              <li>Lesson 3 - Short Sentences and Opposite Words</li>
              <li>Lesson 4 - Food and drinks</li>
              <li>Lesson 5 - Articles and contractions</li>
              <li>Lesson 6 - Polite requests and desires</li>
              <li>Lesson 7 - Order, explore, and talk about food</li>
              <li>Lesson 8 - Ask questions and talk about possibilities</li>
            </ul>
          </div>
        </div>
      </div>
    `
  }
  
  // Grow & Go Bundle
  if (course.bundle_name === 'grow_go') {
    return `
      <div class="course-tabs">
        <div class="tab-buttons">
          <button class="tab-btn active" data-tab="${overviewId}">Overview</button>
          <button class="tab-btn" data-tab="${curriculumId}">Curriculum</button>
        </div>
        <div class="tab-content">
          <div class="tab-pane active" id="${overviewId}">
            <p>The Grow & Go Bundle is an eight-lesson course designed to expand your Portuguese vocabulary and help you communicate more naturally in everyday situations. Through practical, easy-to-apply lessons, you will learn how to talk about food, preferences, needs, and the body, while also strengthening your understanding of key grammar concepts such as verb endings, irregular verbs, comparisons, and gender and number agreement. This course bridges vocabulary and structure, giving you the tools to build clearer, more confident sentences for daily life in Portuguese.</p>
          </div>
          <div class="tab-pane" id="${curriculumId}">
            <h4>Course Curriculum</h4>
            <ul>
              <li>Lesson 1 - Food and preferences</li>
              <li>Lesson 2 - Learn how to talk about likes, preferences, and needs</li>
              <li>Lesson 3 - Understand the three main verb endings: -ar, -er, -ir</li>
              <li>Lesson 4 - Body parts</li>
              <li>Lesson 5 - Build simple comparisons and contrasts in Portuguese</li>
              <li>Lesson 6 - Use colors with nouns, applying gender and number agreement</li>
              <li>Lesson 7 - Irregular verbs</li>
              <li>Lesson 8 - Verb ter (to have)</li>
            </ul>
          </div>
        </div>
      </div>
    `
  }
  
  // The Climb Kit Bundle
  if (course.bundle_name === 'climb_kit') {
    return `
      <div class="course-tabs">
        <div class="tab-buttons">
          <button class="tab-btn active" data-tab="${overviewId}">Overview</button>
          <button class="tab-btn" data-tab="${curriculumId}">Curriculum</button>
        </div>
        <div class="tab-content">
          <div class="tab-pane active" id="${overviewId}">
            <p>The Climb Kit Bundle is an eight-lesson course focused on refining and strengthening your Portuguese grammar while expanding confident, real-world communication. Designed for learners who already have a solid foundation, the course covers advanced structures such as possessive adjectives, commands and suggestions, regular and irregular verbs, and idiomatic expressions, alongside practical vocabulary for travel, daily routines, animals, weather, and time. By combining grammar precision with everyday usage, this bundle helps you speak Portuguese more naturally, accurately, and with greater confidence.</p>
          </div>
          <div class="tab-pane" id="${curriculumId}">
            <h4>Course Curriculum</h4>
            <ul>
              <li>Lesson 1 - Possessive adjectives</li>
              <li>Lesson 2 - Commands, instructions, and suggestions</li>
              <li>Lesson 3 - Clothes and laundry</li>
              <li>Lesson 4 - Travel, commute, and explore with confidence</li>
              <li>Lesson 5 - Regular and common irregular verbs</li>
              <li>Lesson 6 - Common idiomatic expressions</li>
              <li>Lesson 7 - Animals and quantities</li>
              <li>Lesson 8 - Weather and time</li>
            </ul>
          </div>
        </div>
      </div>
    `
  }
  
  // Free Lesson
  if (course.bundle_name === 'free') {
    return `
      <div class="course-tabs">
        <div class="tab-buttons">
          <button class="tab-btn active" data-tab="${overviewId}">Overview</button>
          <button class="tab-btn" data-tab="${curriculumId}">Curriculum</button>
        </div>
        <div class="tab-content">
          <div class="tab-pane active" id="${overviewId}">
            <p>This free lesson gives you a practical introduction to the language. You will learn essential greetings and basic expressions.</p>
            <p>This lesson will help you start speaking and understanding Portuguese from the very first minute.</p>
            <h4>What you'll experience:</h4>
            <ul>
              <li>Practice simple sentences for everyday situations.</li>
              <li>Get a feel for Portuguese pronunciation and structure.</li>
              <li>Experience the style and approach of our full courses.</li>
              <li>Learn Portuguese with confidence and see how enjoyable and practical language learning can be.</li>
            </ul>
          </div>
          <div class="tab-pane" id="${curriculumId}">
            <h4>Course Curriculum</h4>
            <ul>
              <li>Free Introduction Lesson</li>
            </ul>
          </div>
        </div>
      </div>
    `
  }
  
  // World Bundle
  if (course.bundle_name === 'world') {
    return `
      <div class="course-tabs">
        <div class="tab-buttons">
          <button class="tab-btn active" data-tab="${overviewId}">Overview</button>
          <button class="tab-btn" data-tab="${curriculumId}">Curriculum</button>
        </div>
        <div class="tab-content">
          <div class="tab-pane active" id="${overviewId}">
            <p>The World Bundle gives you full access to every lesson on the platform. Designed for learners who want the full experience, it takes you from the basics to advanced expression with structured guidance, clear lessons, and everything you need to become truly fluent.</p>
          </div>
          <div class="tab-pane" id="${curriculumId}">
            <h4>Complete Course Curriculum</h4>
            <ul>
              <li><strong>Hello Starter Bundle</strong></li>
              <li>8 Lessons</li>
              <li><strong>Jumpstart Bundle</strong> – 8 Lessons (Verbs and Short Sentences)</li>
              <li>8 Lessons</li>
              <li><strong>Grow and Go Bundle</strong> – 8 Lessons (Vocabulary for everyday life)</li>
              <li>8 Lessons</li>
              <li><strong>Climb Kit Bundle</strong> – 8 Lessons (Advanced grammar refinement)</li>
              <li>8 Lessons</li>
              <li><strong>Keep Going Bundle</strong> - 8 Lessons (Grammar, and conversation skills)</li>
              <li>8 Lessons</li>
              <li><strong>Elevate Bundle</strong> - 8 Lessons (Past Tenses & Properties)</li>
              <li>8 Lessons</li>
            </ul>
          </div>
        </div>
      </div>
    `
  }
  
  // Default overview for other courses
  return `
    <div class="course-tabs">
      <div class="tab-buttons">
        <button class="tab-btn active" data-tab="${overviewId}">Overview</button>
        <button class="tab-btn" data-tab="${curriculumId}">Curriculum</button>
      </div>
      <div class="tab-content">
        <div class="tab-pane active" id="${overviewId}">
          <p>${course.description || 'Course overview coming soon...'}</p>
        </div>
        <div class="tab-pane" id="${curriculumId}">
          <p>Curriculum details coming soon...</p>
        </div>
      </div>
    </div>
  `
}

// Get purchase button
function getPurchaseButton(course) {
  // For free courses, always require signup if user is not logged in
  if (course.price === 0) {
    if (!currentUser) {
      // For unregistered users, show "Start Free Lesson" but it will redirect to signup
      return `<a href="signup.html" class="btn btn-primary">Start Free Lesson</a>`
    }
    // For logged-in users, allow access to free lesson
    return `<a href="course-player.html?course=${course.id}" class="btn btn-primary">Start Free Lesson</a>`
  }
  
  // For paid courses
  if (!currentUser) {
    return `<a href="signup.html" class="btn btn-primary">Enroll Now</a>`
  }
  
  return `<button class="btn btn-primary purchase-btn" data-course-id="${course.id}">Purchase Course</button>`
}

// Handle purchase
async function handlePurchase(course) {
  if (!currentUser) {
    window.location.href = 'signup.html'
    return
  }
  
  // Check if already purchased
  const hasPurchased = await CourseService.hasPurchasedCourse(currentUser.id, course.id)
  
  if (hasPurchased.success && hasPurchased.purchased) {
    window.location.href = `course-player.html?course=${course.id}`
    return
  }
  
  // Create Stripe checkout session
  try {
    const result = await createCheckoutSession(course.id, currentUser.id)
    
    if (result.success) {
      await redirectToCheckout(result.session.id)
    } else {
      const errorMsg = result.error || 'Unknown error occurred'
      console.error('Checkout session error:', errorMsg)
      
      // Show more helpful error message
      if (errorMsg.includes('Cannot connect') || errorMsg.includes('Failed to fetch') || errorMsg.includes('not running') || errorMsg.includes('Backend server')) {
        alert(`Cannot connect to payment server.\n\n${errorMsg}\n\nTo start the server, open a terminal in the project directory and run:\nnpm run server`)
      } else if (errorMsg.includes('already purchased')) {
        alert('You have already purchased this course. Redirecting to course...')
        window.location.href = `course-player.html?course=${course.id}`
      } else {
        alert(`Error: ${errorMsg}\n\nPlease try again or contact support if the problem persists.`)
      }
    }
  } catch (error) {
    console.error('Unexpected error during purchase:', error)
    alert('An unexpected error occurred. Please try again or refresh the page.')
  }
}

// Add Hello Starter Bundle to static courses if needed
function addHelloStarterIfNeeded() {
  const coursesList = document.querySelector('.courses-list')
  if (!coursesList) return
  
  // Check if Hello Starter Bundle already exists
  const existingHelloStarter = Array.from(coursesList.querySelectorAll('.course-detail-card')).find(
    card => card.textContent.includes('Hello Starter Bundle')
  )
  
  if (!existingHelloStarter) {
    const helloStarterCard = document.createElement('div')
    helloStarterCard.className = 'course-detail-card'
    helloStarterCard.innerHTML = `
      <div class="course-detail-header">
        <div class="course-level-badge beginner">Beginner</div>
        <h2>Hello Starter Bundle</h2>
      </div>
      <div class="course-detail-content">
        <div class="course-info">
          <div class="info-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            <span>8 Lessons</span>
          </div>
          <div class="info-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Lifetime Access</span>
          </div>
        </div>
        <div class="course-description">
          <h3>What You'll Learn</h3>
          <ul>
            <li>Essential greetings and introductions</li>
            <li>Adjectives - describing people, places, and things</li>
            <li>Prepositions - understanding spatial and temporal relationships</li>
            <li>Basic conversation skills</li>
            <li>Practical vocabulary for travel and daily life</li>
          </ul>
        </div>
        <div class="course-price">
          <span class="price">€49.00</span>
          <a href="signup.html" class="btn btn-primary">Enroll Now</a>
        </div>
      </div>
    `
    const staticCourses = document.getElementById('staticCourses')
    if (staticCourses) {
      staticCourses.insertBefore(helloStarterCard, staticCourses.firstChild)
    } else {
      coursesList.insertBefore(helloStarterCard, coursesList.firstChild)
    }
  }
}

// Render static courses (fallback)
function renderStaticCourses() {
  console.log('Using static courses as fallback - database connection may not be configured')
  addHelloStarterIfNeeded()
}

// Initialize on page load
initCoursesPage()

// Handle hash anchor scrolling to World Bundle
window.addEventListener('load', () => {
  if (window.location.hash === '#world-bundle') {
    setTimeout(() => {
      const worldBundle = document.getElementById('world-bundle')
      if (worldBundle) {
        worldBundle.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 500) // Small delay to ensure content is loaded
  }
})

