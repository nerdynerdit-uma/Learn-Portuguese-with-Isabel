// Course Player Handler
import { AuthService } from './auth.js'
import { CourseService } from './course-service.js'

let currentUser = null
let currentCourse = null
let currentLesson = null
let videoPlayer = null

// Initialize player
async function initPlayer() {
  // Scroll to top of page first to ensure proper positioning
  window.scrollTo({ top: 0, behavior: 'instant' })
  
  // Hide all error messages first
  const notLoggedIn = document.getElementById('notLoggedIn')
  const notPurchased = document.getElementById('notPurchased')
  const coursePlayer = document.getElementById('coursePlayer')
  
  if (notLoggedIn) notLoggedIn.style.display = 'none'
  if (notPurchased) notPurchased.style.display = 'none'
  if (coursePlayer) coursePlayer.style.display = 'none'
  
  // Check authentication
  const { user, error: authError } = await AuthService.getCurrentUser()
  
  if (!user) {
    console.log('User not logged in:', authError)
    // Force redirect to signup page for unregistered users
    window.location.href = 'signup.html'
    return
  }
  
  currentUser = user
  console.log('User logged in:', user.id)
  
  // Get course ID from URL
  const urlParams = new URLSearchParams(window.location.search)
  const courseId = urlParams.get('course')
  const lessonId = urlParams.get('lesson')
  
  if (!courseId) {
    console.error('No course ID in URL')
    if (notPurchased) {
      notPurchased.style.display = 'block'
      notPurchased.innerHTML = `
        <h2>Course Not Found</h2>
        <p>Please select a course from your account.</p>
        <a href="account.html" class="btn btn-primary">My Account</a>
      `
    }
    return
  }
  
  console.log('Checking access for course:', courseId, 'user:', user.id)
  
  // Load course first to check if it's free
  const courseResult = await CourseService.getCourse(courseId)
  
  if (!courseResult.success) {
    console.error('Error loading course:', courseResult.error)
    if (notPurchased) {
      notPurchased.style.display = 'block'
      notPurchased.innerHTML = `
        <h2>Course Not Found</h2>
        <p>${courseResult.error || 'The course could not be loaded.'}</p>
        <a href="account.html" class="btn btn-primary">My Account</a>
      `
    }
    return
  }
  
  const course = courseResult.course
  const isFreeCourse = course.price === 0 || course.bundle_name === 'free'
  
  console.log('Course info:', { name: course.name, price: course.price, bundle_name: course.bundle_name, isFree: isFreeCourse })
  
  // If course is free, allow access without purchase check
  if (!isFreeCourse) {
    // Check if user has purchased the course (only for paid courses)
    const hasPurchased = await CourseService.hasPurchasedCourse(user.id, courseId)
    
    console.log('Purchase check result:', hasPurchased)
    
    if (!hasPurchased.success) {
      console.error('Error checking purchase:', hasPurchased.error)
      if (notPurchased) {
        notPurchased.style.display = 'block'
        notPurchased.innerHTML = `
          <h2>Error Checking Access</h2>
          <p>There was an error verifying your purchase. Please try again.</p>
          <a href="account.html" class="btn btn-primary">My Account</a>
        `
      }
      return
    }
    
    if (!hasPurchased.purchased) {
      console.log('Course not purchased')
      if (notPurchased) {
        notPurchased.style.display = 'block'
        notPurchased.innerHTML = `
          <h2>Course Not Purchased</h2>
          <p>You need to purchase this course to access the lessons.</p>
          <a href="courses.html" class="btn btn-primary">View Courses</a>
        `
      }
      return
    }
  } else {
    console.log('Free course - access granted without purchase check')
  }
  
  console.log('Access granted, loading course...')
  
  // Course already loaded above, use it
  currentCourse = course
  console.log('Course loaded:', currentCourse.name, 'Lessons:', currentCourse.lessons?.length)
  
  if (coursePlayer) {
    coursePlayer.style.display = 'block'
    // Scroll to top of page to ensure video is visible
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // Also scroll the course player section into view
    coursePlayer.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  
  // Load course info
  document.getElementById('courseName').textContent = currentCourse.name
  document.getElementById('courseDescription').textContent = currentCourse.description || ''
  
  // Load lessons list
  await loadLessonsList(currentCourse.lessons)
  
  // Check if course has lessons
  if (!currentCourse.lessons || currentCourse.lessons.length === 0) {
    console.error('Course has no lessons')
    const lessonInfo = document.querySelector('.lesson-info')
    if (lessonInfo) {
      lessonInfo.innerHTML = `
        <h2>No Lessons Available</h2>
        <p>This course doesn't have any lessons yet. Please check back later.</p>
        <a href="courses.html" class="btn btn-primary" style="margin-top: 1rem;">Back to Courses</a>
      `
    }
    return
  }
  
  // Determine which lesson to load
  let lessonToLoad = null
  
  if (lessonId) {
    // If lesson ID is specified in URL, use that
    lessonToLoad = currentCourse.lessons.find(l => l.id === lessonId)
  } else {
    // Find the last completed lesson and load the next one
    lessonToLoad = await findNextLessonToLoad(currentCourse.lessons, currentUser.id)
  }
  
  if (lessonToLoad) {
    await loadLesson(lessonToLoad, false) // false = don't auto-play
  } else {
    // If no lesson found, load the first one
    console.log('No specific lesson found, loading first lesson')
    if (currentCourse.lessons && currentCourse.lessons.length > 0) {
      await loadLesson(currentCourse.lessons[0], false)
    } else {
      const lessonInfo = document.querySelector('.lesson-info')
      if (lessonInfo) {
        lessonInfo.innerHTML = `
          <h2>No Lessons Available</h2>
          <p>This course doesn't have any lessons yet. Please check back later.</p>
          <a href="courses.html" class="btn btn-primary" style="margin-top: 1rem;">Back to Courses</a>
        `
      }
    }
  }
  
  // Final scroll to ensure video is visible after everything loads
  setTimeout(() => {
    const videoContainer = document.querySelector('.video-container')
    if (videoContainer) {
      const navbar = document.querySelector('.navbar')
      const navbarHeight = navbar ? navbar.offsetHeight : 0
      const containerRect = videoContainer.getBoundingClientRect()
      
      // Only scroll if video container is not visible in viewport
      if (containerRect.top < navbarHeight || containerRect.bottom > window.innerHeight) {
        const scrollPosition = videoContainer.offsetTop - navbarHeight - 20
        window.scrollTo({ 
          top: Math.max(0, scrollPosition), 
          behavior: 'smooth' 
        })
      }
    }
  }, 300)
}

// Parse lesson title to extract bundle name and lesson name
function parseLessonTitle(title) {
  // Check if title contains " - " separator (format: "Bundle Name - Lesson X: Title")
  if (title.includes(' - ')) {
    const parts = title.split(' - ', 2)
    if (parts.length === 2) {
      return {
        bundleName: parts[0].trim(),
        lessonName: parts[1].trim()
      }
    }
  }
  // If no separator, treat entire title as lesson name
  return {
    bundleName: null,
    lessonName: title
  }
}

// Load lessons list
async function loadLessonsList(lessons) {
  const list = document.getElementById('lessonsList')
  list.innerHTML = ''
  
  let currentBundleName = null
  let bundleGroup = null
  
  for (let index = 0; index < lessons.length; index++) {
    const lesson = lessons[index]
    const { bundleName, lessonName } = parseLessonTitle(lesson.title)
    
    // Create bundle group header if bundle name changes
    if (bundleName && bundleName !== currentBundleName) {
      currentBundleName = bundleName
      
      // Close previous bundle group if exists
      if (bundleGroup) {
        list.appendChild(bundleGroup)
      }
      
      // Create new bundle group
      bundleGroup = document.createElement('li')
      bundleGroup.className = 'bundle-group'
      
      const bundleHeader = document.createElement('div')
      bundleHeader.className = 'bundle-header'
      bundleHeader.textContent = bundleName
      bundleGroup.appendChild(bundleHeader)
      
      const bundleLessons = document.createElement('ul')
      bundleLessons.className = 'bundle-lessons'
      bundleGroup.appendChild(bundleLessons)
    }
    
    // Create lesson item
    const li = document.createElement('li')
    li.className = 'lesson-item'
    if (lesson.id === currentLesson?.id) {
      li.classList.add('active')
    }
    
    // Check if lesson is completed
    let isCompleted = false
    if (currentUser) {
      try {
        const progressResult = await CourseService.getLessonProgress(currentUser.id, lesson.id)
        console.log(`Loading progress for lesson ${lesson.id} (${lesson.title}):`, progressResult)
        if (progressResult.success && progressResult.progress) {
          // Check for boolean true explicitly - handle all possible formats
          const completedValue = progressResult.progress.completed
          isCompleted = completedValue === true || completedValue === 'true' || completedValue === 1 || completedValue === '1'
          console.log(`Lesson ${lesson.id} completed status: ${completedValue} (${typeof completedValue}) -> ${isCompleted}`)
          if (isCompleted) {
            li.classList.add('completed')
          }
        }
      } catch (error) {
        console.error(`Error loading progress for lesson ${lesson.id}:`, error)
        // Don't remove existing checkmarks on error
      }
    }
    
    const checkmark = isCompleted ? '<span class="lesson-checkmark">✓</span>' : ''
    
    // If we have a bundle group, add to it; otherwise add directly to main list
    const targetList = bundleGroup ? bundleGroup.querySelector('.bundle-lessons') : list
    
    li.innerHTML = `
      <a href="#" data-lesson-id="${lesson.id}" class="lesson-link">
        <span class="lesson-number">${index + 1}</span>
        <div class="lesson-content">
          <span class="lesson-title">${checkmark}${lessonName}</span>
          ${lesson.duration ? `<span class="lesson-duration">${lesson.duration} min</span>` : ''}
        </div>
      </a>
    `
    
    li.querySelector('.lesson-link').addEventListener('click', (e) => {
      e.preventDefault()
      loadLesson(lesson, false) // Don't auto-play when user clicks
    })
    
    targetList.appendChild(li)
  }
  
  // Append last bundle group if exists
  if (bundleGroup) {
    list.appendChild(bundleGroup)
  }
}

// Find the next lesson to load (after last completed lesson)
async function findNextLessonToLoad(lessons, userId) {
  if (!lessons || lessons.length === 0) {
    console.log('No lessons available')
    return null
  }
  
  // If no user ID, just return first lesson
  if (!userId) {
    console.log('No user ID, loading first lesson')
    return lessons[0]
  }
  
  // Check progress for all lessons to find the last completed one
  let lastCompletedIndex = -1
  
  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i]
    try {
      const progressResult = await CourseService.getLessonProgress(userId, lesson.id)
      if (progressResult.success && progressResult.progress) {
        const isCompleted = progressResult.progress.completed === true || 
                           progressResult.progress.completed === 'true' || 
                           progressResult.progress.completed === 1 || 
                           progressResult.progress.completed === '1'
        if (isCompleted) {
          lastCompletedIndex = i
          console.log(`✅ Lesson ${i + 1} (${lesson.title}) is completed`)
        }
      }
    } catch (error) {
      console.error(`Error checking progress for lesson ${lesson.id}:`, error)
      // On error, just continue - don't block lesson loading
    }
  }
  
  // Load the next lesson after the last completed one
  const nextLessonIndex = lastCompletedIndex + 1
  
  if (nextLessonIndex < lessons.length) {
    console.log(`📚 Loading next lesson: ${nextLessonIndex + 1} (${lessons[nextLessonIndex].title})`)
    return lessons[nextLessonIndex]
  } else if (lastCompletedIndex >= 0) {
    // All lessons completed, load the last one
    console.log('📚 All lessons completed, loading last lesson')
    return lessons[lessons.length - 1]
  } else {
    // No lessons completed, load the first one
    console.log('📚 No lessons completed yet, loading first lesson')
    return lessons[0]
  }
}

// Load lesson
async function loadLesson(lesson, autoPlay = false) {
  currentLesson = lesson
  
  // Update UI
  document.getElementById('lessonTitle').textContent = lesson.title
  document.getElementById('lessonDescription').textContent = lesson.description || ''
  
  // Update active lesson in list
  document.querySelectorAll('.lesson-item').forEach(item => {
    item.classList.remove('active')
    if (item.querySelector(`[data-lesson-id="${lesson.id}"]`)) {
      item.classList.add('active')
    }
  })
  
  // Update URL
  const newUrl = `course-player.html?course=${currentCourse.id}&lesson=${lesson.id}`
  window.history.pushState({}, '', newUrl)
  
  // Scroll to top to ensure video is visible
  window.scrollTo({ top: 0, behavior: 'smooth' })
  
  // Scroll video container into view (with offset for navbar)
  setTimeout(() => {
    const videoContainer = document.querySelector('.video-container')
    if (videoContainer) {
      const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0
      const containerTop = videoContainer.getBoundingClientRect().top + window.pageYOffset
      window.scrollTo({ 
        top: containerTop - navbarHeight - 20, 
        behavior: 'smooth' 
      })
    }
  }, 100)
  
  // Load video (don't auto-play)
  loadVideo(lesson, autoPlay)
  
  // Add completion button below lesson description
  addCompletionButton()
  
  // Load and display existing progress
  const progressResult = await CourseService.getLessonProgress(currentUser.id, lesson.id)
  if (progressResult.success && progressResult.progress) {
    console.log('Existing progress:', progressResult.progress)
    // If already completed, show completion status
    if (progressResult.progress.completed) {
      // Mark as complete visually
      const activeItem = document.querySelector('.lesson-item.active')
      if (activeItem) {
        activeItem.classList.add('completed')
      }
      // Update checkmark in list
      updateLessonListCheckmarks()
    }
  } else {
    // Mark lesson as started (10% progress)
    updateProgress(10, false)
  }
}

// Load video
function loadVideo(lesson, autoPlay = false) {
  const playerContainer = document.getElementById('videoPlayer')
  if (!playerContainer) {
    console.error('Video player container not found')
    return
  }
  
  playerContainer.innerHTML = ''
  
  console.log('Loading video:', lesson.video_url)
  
  // Check if URL is an iframe embed (BunnyStream, etc.)
  if (lesson.video_url && (lesson.video_url.includes('player.mediadelivery.net') || lesson.video_url.includes('iframe.mediadelivery.net'))) {
    // BunnyStream iframe embed
    const iframe = document.createElement('iframe')
    // Remove autoplay from URL if autoPlay is false
    let videoUrl = lesson.video_url
    if (!autoPlay) {
      // Remove autoplay parameter if present
      videoUrl = videoUrl.replace(/[?&]autoplay=1/g, '').replace(/[?&]autoplay=true/g, '')
    } else if (!videoUrl.includes('autoplay')) {
      // Add autoplay if autoPlay is true and not already present
      videoUrl += (videoUrl.includes('?') ? '&' : '?') + 'autoplay=1'
    }
    iframe.src = videoUrl
    iframe.width = '100%'
    iframe.height = '100%'
    iframe.frameBorder = '0'
    iframe.allow = 'autoplay; fullscreen; picture-in-picture'
    iframe.allowFullscreen = true
    iframe.style.border = 'none'
    iframe.style.display = 'block'
    iframe.setAttribute('loading', 'eager')
    playerContainer.appendChild(iframe)
    videoPlayer = iframe
    console.log('BunnyStream iframe loaded')
    
    // Track progress for iframe embeds
    // Since we can't directly track iframe video progress, we'll:
    // 1. Mark as started when loaded
    // 2. Add a "Mark as Complete" button
    // 3. Track time spent on page
    
    // Mark lesson as started
    updateProgress(10, false) // 10% when loaded
    
    // Listen for messages from iframe (if BunnyStream supports it)
    window.addEventListener('message', (event) => {
      // Handle messages from BunnyStream player if available
      if (event.data && typeof event.data === 'object') {
        if (event.data.type === 'video-progress' && event.data.percentage) {
          const isCompleted = event.data.percentage >= 90
          updateProgress(event.data.percentage, isCompleted)
        }
      }
    })
    
    // Note: Completion button is added in loadLesson(), not here
    
    // Track time spent watching
    let watchStartTime = Date.now()
    const watchInterval = setInterval(() => {
      const timeSpent = Date.now() - watchStartTime
      const minutesWatched = timeSpent / 60000 // Convert to minutes
      
      // Estimate progress based on time (assuming average lesson is 15-20 min)
      // If user watches for more than 80% of estimated duration, mark as complete
      const estimatedDuration = lesson.duration || 15
      const progressPercent = Math.min(100, (minutesWatched / estimatedDuration) * 100)
      
      if (progressPercent >= 80) {
        updateProgress(progressPercent, true)
        clearInterval(watchInterval)
      } else if (progressPercent > 10) {
        updateProgress(progressPercent, false)
      }
    }, 30000) // Check every 30 seconds
    
    // Clean up interval when leaving page
    window.addEventListener('beforeunload', () => {
      clearInterval(watchInterval)
    })
  } else if (lesson.video_provider === 'vimeo' || (lesson.video_url && lesson.video_url.includes('vimeo.com'))) {
    // Vimeo embed
    const vimeoId = extractVimeoId(lesson.video_url)
    if (vimeoId) {
      const iframe = document.createElement('iframe')
      iframe.src = `https://player.vimeo.com/video/${vimeoId}${autoPlay ? '?autoplay=1' : ''}`
      iframe.width = '100%'
      iframe.height = '500'
      iframe.frameBorder = '0'
      iframe.allow = 'autoplay; fullscreen; picture-in-picture'
      iframe.allowFullscreen = true
      playerContainer.appendChild(iframe)
      videoPlayer = iframe
    }
  } else if (lesson.video_provider === 'youtube' || (lesson.video_url && lesson.video_url.includes('youtube.com') || lesson.video_url.includes('youtu.be'))) {
    // YouTube embed
    const youtubeId = extractYoutubeId(lesson.video_url)
    if (youtubeId) {
      const iframe = document.createElement('iframe')
      iframe.src = `https://www.youtube.com/embed/${youtubeId}${autoPlay ? '?autoplay=1' : ''}`
      iframe.width = '100%'
      iframe.height = '500'
      iframe.frameBorder = '0'
      iframe.allow = 'autoplay; encrypted-media'
      iframe.allowFullscreen = true
      playerContainer.appendChild(iframe)
      videoPlayer = iframe
    }
  } else {
    // Direct video URL (using HTML5 video player) - works with BunnyStream direct URLs
    const video = document.createElement('video')
    video.src = lesson.video_url
    video.controls = true
    video.controlsList = 'play pause volume fullscreen'
    video.width = '100%'
    video.height = '100%'
    video.style.width = '100%'
    video.style.height = '100%'
    video.style.objectFit = 'contain'
    video.autoplay = autoPlay // Only autoplay if explicitly requested
    video.preload = 'metadata' // Load metadata but don't auto-play
    playerContainer.appendChild(video)
    videoPlayer = video
    
    // Track progress
    video.addEventListener('timeupdate', () => {
      if (video.duration) {
        const progress = (video.currentTime / video.duration) * 100
        updateProgress(progress, video.currentTime >= video.duration * 0.9)
      }
    })
    
    // Handle video errors
    video.addEventListener('error', (e) => {
      console.error('Video error:', e)
      playerContainer.innerHTML = `
        <div style="padding: 2rem; text-align: center; background: #f5f5f5; border-radius: 8px; color: #d32f2f;">
          <p style="margin-bottom: 1rem;">Error loading video. Please check the video URL.</p>
          <p style="color: #666; font-size: 0.9rem;">URL: ${lesson.video_url}</p>
        </div>
      `
    })
    
    // Handle video loaded
    video.addEventListener('loadedmetadata', () => {
      console.log('Video metadata loaded:', video.duration)
    })
    
    console.log('HTML5 video player loaded')
  }
  
  // Ensure player container is visible
  if (playerContainer.parentElement) {
    playerContainer.parentElement.style.display = 'block'
  }
  
  // Ensure video container is visible and scroll into view if needed
  const videoContainer = document.querySelector('.video-container')
  if (videoContainer) {
    videoContainer.style.display = 'block'
    videoContainer.style.visibility = 'visible'
    videoContainer.style.opacity = '1'
    
    // Scroll to video container after a brief delay to ensure it's rendered
    setTimeout(() => {
      const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0
      const containerTop = videoContainer.getBoundingClientRect().top + window.pageYOffset
      const scrollPosition = containerTop - navbarHeight - 20
      
      if (window.pageYOffset > scrollPosition || window.pageYOffset === 0) {
        window.scrollTo({ 
          top: Math.max(0, scrollPosition), 
          behavior: 'smooth' 
        })
      }
    }, 200)
  }
}

// Extract Vimeo ID from URL
function extractVimeoId(url) {
  const match = url.match(/vimeo\.com\/(\d+)/)
  return match ? match[1] : null
}

// Extract YouTube ID from URL
function extractYoutubeId(url) {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
  return match ? match[1] : null
}

// Update progress
async function updateProgress(percentage, completed) {
  if (!currentUser || !currentLesson) {
    console.log('Cannot update progress: missing user or lesson', { user: currentUser, lesson: currentLesson })
    return { success: false, error: 'Missing user or lesson' }
  }
  
  console.log('Updating progress:', {
    userId: currentUser.id,
    lessonId: currentLesson.id,
    percentage: Math.round(percentage),
    completed: completed
  })
  
  // Ensure completed is a boolean
  const completedBool = completed === true || completed === 'true' || completed === 1
  
  const result = await CourseService.updateLessonProgress(currentUser.id, currentLesson.id, {
    progress_percentage: Math.round(percentage),
    completed: completedBool
  })
  
  if (result.success) {
    console.log('Progress updated successfully:', result)
    
    // Verify it was saved by reading it back
    setTimeout(async () => {
      const verify = await CourseService.getLessonProgress(currentUser.id, currentLesson.id)
      if (verify.success && verify.progress) {
        console.log('✅ Progress verified in database:', verify.progress)
        console.log('✅ Completed status:', verify.progress.completed, typeof verify.progress.completed)
      } else {
        console.error('❌ Progress NOT found in database after save!')
      }
    }, 1000)
    
    return { success: true, data: result.data }
  } else {
    console.error('Error updating progress:', result.error)
    return { success: false, error: result.error }
  }
}

// Add completion button below lesson description
async function addCompletionButton() {
  const lessonInfo = document.querySelector('.lesson-info')
  if (!lessonInfo) return
  
  // Remove existing button if any
  const existingBtn = lessonInfo.querySelector('.mark-complete-btn')
  if (existingBtn) existingBtn.remove()
  
  // Check if lesson is already completed
  if (!currentUser || !currentLesson) return
  
  const progressResult = await CourseService.getLessonProgress(currentUser.id, currentLesson.id)
  const isCompleted = progressResult.success && progressResult.progress && progressResult.progress.completed
  
  const buttonContainer = document.createElement('div')
  buttonContainer.style.cssText = 'margin-top: 1.5rem; text-align: left;'
  
  const completeBtn = document.createElement('button')
  completeBtn.className = 'btn btn-primary mark-complete-btn'
  completeBtn.textContent = isCompleted ? '✓ Completed' : 'Mark as Complete'
  completeBtn.style.cssText = 'padding: 0.75rem 2rem; font-size: 1rem;'
  
  if (isCompleted) {
    completeBtn.disabled = true
    completeBtn.style.background = 'var(--color-green)'
  }
  
  completeBtn.addEventListener('click', async () => {
    if (!currentUser || !currentLesson) return
    
    // Mark as complete
    const result = await updateProgress(100, true)
    
    if (result && result.success !== false) {
      completeBtn.textContent = '✓ Completed'
      completeBtn.disabled = true
      completeBtn.style.background = 'var(--color-green)'
      
      // Update only the current lesson's checkmark in the list immediately
      const currentLessonItem = document.querySelector(`[data-lesson-id="${currentLesson.id}"]`)?.closest('.lesson-item')
      if (currentLessonItem) {
        const lessonTitle = currentLessonItem.querySelector('.lesson-title')
        if (lessonTitle) {
          // Get original title without checkmark
          const originalTitle = currentLesson.title
          // Always set checkmark for the completed lesson
          lessonTitle.innerHTML = `<span style="color: var(--color-green); margin-right: 0.5rem; font-weight: bold;">✓</span>${originalTitle}`
        }
        currentLessonItem.classList.add('completed')
        console.log('✅ Updated checkmark for current lesson:', currentLesson.id)
      }
      
      // Refresh all checkmarks after a short delay to ensure database is updated
      // But only update lessons where we successfully load progress
      setTimeout(async () => {
        await updateLessonListCheckmarks()
      }, 1000)
      
      // Show success message
      const successMsg = document.createElement('div')
      successMsg.textContent = 'Lesson marked as complete! Progress saved.'
      successMsg.style.cssText = 'margin-top: 0.5rem; color: var(--color-green); font-weight: 600;'
      buttonContainer.appendChild(successMsg)
      
      setTimeout(() => {
        successMsg.remove()
      }, 3000)
    } else {
      alert('Failed to save progress. Please try again.')
    }
  })
  
  buttonContainer.appendChild(completeBtn)
  lessonInfo.appendChild(buttonContainer)
}

// Update lesson list to show checkmarks for completed lessons
async function updateLessonListCheckmarks() {
  if (!currentUser || !currentCourse) return
  
  console.log('Updating lesson list checkmarks...')
  
  const lessonItems = document.querySelectorAll('.lesson-item')
  
  // Get progress for all lessons at once using getCourseProgress to avoid race conditions
  console.log('Loading all progress for course:', currentCourse.id)
  const courseProgressResult = await CourseService.getCourseProgress(currentUser.id, currentCourse.id)
  
  // Create a map of lesson_id -> progress for quick lookup
  const progressMap = new Map()
  if (courseProgressResult.success && courseProgressResult.progress && courseProgressResult.progress.lessons) {
    courseProgressResult.progress.lessons.forEach(p => {
      progressMap.set(p.lesson_id, p)
    })
    console.log('Loaded progress map:', Array.from(progressMap.entries()).map(([id, p]) => ({ lessonId: id, completed: p.completed })))
  }
  
  // Update each lesson item
  for (const item of lessonItems) {
    const lessonLink = item.querySelector('[data-lesson-id]')
    if (!lessonLink) continue
    
    const lessonId = lessonLink.getAttribute('data-lesson-id')
    
    try {
      // Use the progress map instead of individual queries
      const progress = progressMap.get(lessonId)
      
      console.log(`Lesson ${lessonId} progress from map:`, progress)
      
      if (progress) {
        // progress.completed might be boolean, string, or number - normalize it
        const isCompleted = progress.completed === true || progress.completed === 'true' || progress.completed === 1 || progress.completed === '1'
        
        const lessonTitle = item.querySelector('.lesson-title')
        if (!lessonTitle) continue
        
        // Get the original lesson title (without checkmark) from the course data
        const lesson = currentCourse.lessons.find(l => l.id === lessonId)
        const originalTitle = lesson ? lesson.title : lessonTitle.textContent.replace(/^✓\s*/, '').trim()
        
        console.log(`Lesson ${lessonId} (${originalTitle}): completed=${progress.completed} (${typeof progress.completed}) -> ${isCompleted}`)
        
        if (isCompleted) {
          // Always set checkmark for completed lessons (ensures it's there)
          lessonTitle.innerHTML = `<span style="color: var(--color-green); margin-right: 0.5rem; font-weight: bold;">✓</span>${originalTitle}`
          item.classList.add('completed')
          console.log(`✅ Lesson ${lessonId} marked as completed in UI`)
        } else {
          // Only remove checkmark if lesson is not completed
          // But preserve the title structure
          if (lessonTitle.innerHTML.includes('✓')) {
            lessonTitle.innerHTML = originalTitle
          }
          item.classList.remove('completed')
        }
      } else {
        // No progress record exists (lesson not started) - remove checkmark if present
        const lessonTitle = item.querySelector('.lesson-title')
        if (lessonTitle && lessonTitle.innerHTML.includes('✓')) {
          const lesson = currentCourse.lessons.find(l => l.id === lessonId)
          const originalTitle = lesson ? lesson.title : lessonTitle.textContent.replace(/^✓\s*/, '').trim()
          lessonTitle.innerHTML = originalTitle
        }
        item.classList.remove('completed')
        console.log(`Lesson ${lessonId} has no progress, removed checkmark`)
      }
    } catch (error) {
      console.error(`Error checking progress for lesson ${lessonId}:`, error)
    }
  }
}

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
    }
  }
}

// Initialize on page load
updateNavForAuth()
initPlayer()



