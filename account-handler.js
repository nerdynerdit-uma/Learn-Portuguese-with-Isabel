// Account Dashboard Handler
import { AuthService } from './auth.js'
import { CourseService } from './course-service.js'

let currentUser = null
let isLoadingCourses = false

// Check authentication status
async function checkAuth() {
  const { user } = await AuthService.getCurrentUser()
  
  if (user) {
    currentUser = user
    showLoggedInState(user)
    loadUserCourses(user.id)
    updateNavForAuth()
  } else {
    showNotLoggedInState()
  }
}

// Show logged in state
function showLoggedInState(user) {
  document.getElementById('notLoggedIn').style.display = 'none'
  document.getElementById('loggedIn').style.display = 'block'
  
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student'
  document.getElementById('userName').textContent = userName
  document.getElementById('userEmail').textContent = user.email
}

// Show not logged in state
function showNotLoggedInState() {
  document.getElementById('notLoggedIn').style.display = 'block'
  document.getElementById('loggedIn').style.display = 'none'
}

// Update navigation for authenticated user
function updateNavForAuth() {
  const authNavItem = document.getElementById('authNavItem')
  if (authNavItem) {
    authNavItem.innerHTML = `
      <a href="#" id="signOutNavBtn" class="btn btn-signin">Sign Out</a>
    `
    document.getElementById('signOutNavBtn').addEventListener('click', handleSignOut)
  }
}

// Load user's courses
async function loadUserCourses(userId) {
  // Prevent concurrent calls
  if (isLoadingCourses) {
    console.log('Already loading courses, skipping...')
    return
  }
  
  isLoadingCourses = true
  const grid = document.getElementById('myCoursesGrid')
  const loadingMessage = grid.querySelector('.loading-message')
  
  try {
    const result = await CourseService.getUserCourses(userId)
    
    console.log('User courses result:', result) // Debug log
    
    if (result.success && result.purchases && result.purchases.length > 0) {
      document.getElementById('noCourses').style.display = 'none'
      if (loadingMessage) loadingMessage.style.display = 'none'
      grid.innerHTML = ''
      
      // Deduplicate courses by course_id to avoid showing the same course multiple times
      const seenCourses = new Set()
      const uniquePurchases = []
      
      for (const purchase of result.purchases) {
        // Handle nested course data structure
        const course = purchase.courses || purchase
        if (!course || !course.id) {
          console.warn('Invalid course data:', purchase)
          continue
        }
        
        // Skip if we've already seen this course
        if (seenCourses.has(course.id)) {
          console.log('Skipping duplicate course:', course.name, course.id)
          continue
        }
        
        seenCourses.add(course.id)
        uniquePurchases.push(purchase)
      }
      
      console.log(`Found ${result.purchases.length} purchases, ${uniquePurchases.length} unique courses`)
      
      for (const purchase of uniquePurchases) {
        // Handle nested course data structure
        const course = purchase.courses || purchase
        if (!course || !course.id) {
          console.warn('Invalid course data:', purchase)
          continue
        }
        
        const progressResult = await CourseService.getCourseProgress(userId, course.id)
        console.log('Progress result for course:', course.name, progressResult)
        
        // Always use progress from the result, even if success is false (it will have default values)
        const completed = progressResult.progress ? progressResult.progress.completed : 0
        const total = progressResult.progress ? progressResult.progress.total : (course.lesson_count || 0)
        const percentage = progressResult.progress ? progressResult.progress.percentage : 0
        
        console.log(`📊 Course ${course.name}: ${completed}/${total} lessons completed (${percentage}%)`)
        
        if (!progressResult.success) {
          console.error('⚠️ Error loading progress for course:', course.name, progressResult.error)
        }
        
        const card = document.createElement('div')
        card.className = 'course-card'
        card.innerHTML = `
          <div class="course-content">
            <h3>${course.name || 'Course'}</h3>
            <p>${course.description || ''}</p>
            <div class="course-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
              </div>
              <span class="progress-text">${completed} / ${total} lessons completed</span>
            </div>
            <a href="course-player.html?course=${course.id}" class="btn btn-primary">Continue Learning</a>
          </div>
        `
        grid.appendChild(card)
      }
      
      loadProgressStats(userId, uniquePurchases)
    } else {
      if (loadingMessage) loadingMessage.style.display = 'none'
      grid.innerHTML = ''
      document.getElementById('noCourses').style.display = 'block'
      console.log('No purchases found. Result:', result)
    }
  } catch (error) {
    console.error('Error loading user courses:', error)
    if (loadingMessage) loadingMessage.style.display = 'none'
    grid.innerHTML = ''
    document.getElementById('noCourses').style.display = 'block'
  } finally {
    isLoadingCourses = false
  }
}

// Load progress statistics
async function loadProgressStats(userId, purchases) {
  console.log('Loading progress stats for user:', userId, 'purchases:', purchases.length)
  
  let totalLessons = 0
  let completedLessons = 0
  
  for (const purchase of purchases) {
    const course = purchase.courses || purchase
    const courseId = course.id
    
    console.log('Getting progress for course:', course.name, courseId)
    
    const progress = await CourseService.getCourseProgress(userId, courseId)
    
    console.log('Progress result:', progress)
    
    if (progress.success) {
      totalLessons += progress.progress.total
      completedLessons += progress.progress.completed
      console.log(`Course ${course.name}: ${progress.progress.completed}/${progress.progress.total} completed`)
    } else {
      console.error('Error getting progress for course:', course.name, progress.error)
    }
  }
  
  console.log('Final stats:', { totalLessons, completedLessons, percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0 })
  
  const statsDiv = document.getElementById('progressStats')
  statsDiv.innerHTML = `
    <div class="stat-card">
      <div class="stat-number">${purchases.length}</div>
      <div class="stat-label">Courses Purchased</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${totalLessons}</div>
      <div class="stat-label">Total Lessons</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${completedLessons}</div>
      <div class="stat-label">Lessons Completed</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0}%</div>
      <div class="stat-label">Overall Progress</div>
    </div>
  `
}

// Handle sign out
async function handleSignOut() {
  const result = await AuthService.signOut()
  if (result.success) {
    window.location.href = 'index.html'
  }
}

// Refresh progress when page becomes visible (user returns from course player)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && currentUser) {
    // Page is now visible, refresh progress
    console.log('Page visible, refreshing progress...')
    setTimeout(() => {
      loadUserCourses(currentUser.id)
    }, 500) // Small delay to ensure Supabase session is ready
  }
})

// Also refresh when page gains focus
window.addEventListener('focus', () => {
  if (currentUser) {
    console.log('Page focused, refreshing progress...')
    setTimeout(() => {
      loadUserCourses(currentUser.id)
    }, 500)
  }
})

// Refresh when returning from course player (using pageshow event)
window.addEventListener('pageshow', (event) => {
  if (event.persisted && currentUser) {
    // Page was loaded from cache, refresh progress
    console.log('Page loaded from cache, refreshing progress...')
    setTimeout(() => {
      loadUserCourses(currentUser.id)
    }, 500)
  }
})

// Refresh courses button
const refreshCoursesBtn = document.getElementById('refreshCoursesBtn')
if (refreshCoursesBtn) {
  refreshCoursesBtn.addEventListener('click', async () => {
    if (currentUser) {
      refreshCoursesBtn.style.display = 'none'
      document.getElementById('myCoursesGrid').innerHTML = '<div class="loading-message">Refreshing courses...</div>'
      await loadUserCourses(currentUser.id)
    }
  })
  
  // Show refresh button if no courses found
  setTimeout(() => {
    const noCourses = document.getElementById('noCourses')
    if (noCourses && noCourses.style.display !== 'none') {
      refreshCoursesBtn.style.display = 'inline-block'
    }
  }, 2000)
}

// Initialize on page load
checkAuth()



