// Course Service - Handles course data and purchases
import { supabase } from './supabase-config.js'

export class CourseService {
  // Get all courses
  static async getAllCourses() {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      return { success: true, courses: data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Get single course with lessons
  static async getCourse(courseId) {
    try {
      // Get course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (courseError) throw courseError

      // Get lessons
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('lesson_order', { ascending: true })

      if (lessonsError) throw lessonsError

      return {
        success: true,
        course: { ...course, lessons }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Check if user has purchased a course
  static async hasPurchasedCourse(userId, courseId) {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('status', 'completed')
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
      return { success: true, purchased: !!data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Get user's purchased courses AND free courses with progress
  static async getUserCourses(userId) {
    try {
      // Get purchased courses
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select(`
          *,
          courses (
            id,
            name,
            description,
            bundle_name,
            lesson_count,
            price
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')

      if (purchasesError) {
        console.error('Error loading purchases:', purchasesError)
      }

      // Get all free courses (price = 0)
      const { data: freeCourses, error: freeCoursesError } = await supabase
        .from('courses')
        .select(`
          id,
          name,
          description,
          bundle_name,
          lesson_count,
          price
        `)
        .eq('price', 0)

      if (freeCoursesError) {
        console.error('Error loading free courses:', freeCoursesError)
      }

      // Get user's lesson progress to find which free courses they've started
      const { data: allProgress, error: progressError } = await supabase
        .from('lesson_progress')
        .select(`
          lesson_id,
          lessons!inner (
            course_id,
            courses!inner (
              id
            )
          )
        `)
        .eq('user_id', userId)

      if (progressError) {
        console.error('Error loading progress:', progressError)
      }

      // Find free courses where user has progress
      const freeCoursesWithProgress = []
      if (freeCourses && allProgress) {
        const courseIdsWithProgress = new Set()
        
        // Get unique course IDs from progress
        for (const progress of allProgress) {
          if (progress.lessons?.courses?.id) {
            courseIdsWithProgress.add(progress.lessons.courses.id)
          }
        }
        
        console.log('Free courses with progress:', Array.from(courseIdsWithProgress))
        
        // Add free courses that have progress
        for (const freeCourse of freeCourses) {
          if (courseIdsWithProgress.has(freeCourse.id)) {
            console.log('Adding free course with progress:', freeCourse.name)
            // Create a pseudo-purchase record for free courses with progress
            freeCoursesWithProgress.push({
              id: `free-${freeCourse.id}`,
              user_id: userId,
              course_id: freeCourse.id,
              status: 'completed',
              amount_paid: 0,
              courses: freeCourse
            })
          }
        }
      }

      // Combine purchased courses and free courses with progress
      const allCourses = [...(purchases || []), ...freeCoursesWithProgress]

      console.log('All user courses:', {
        purchased: purchases?.length || 0,
        freeWithProgress: freeCoursesWithProgress.length,
        total: allCourses.length
      })

      return { success: true, purchases: allCourses }
    } catch (error) {
      console.error('Error in getUserCourses:', error)
      return { success: false, error: error.message }
    }
  }

  // Get lesson progress
  static async getLessonProgress(userId, lessonId) {
    try {
      console.log('Loading progress for:', { userId, lessonId })
      
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No progress found - this is normal for lessons not started
          console.log('No progress found for lesson:', lessonId)
          return { success: false, error: 'No progress found', errorCode: 'PGRST116' }
        } else {
          console.error('Error loading progress:', error)
          throw error
        }
      }
      
      if (!data) {
        console.log('No progress data returned for lesson:', lessonId)
        return { success: false, error: 'No progress found', errorCode: 'PGRST116' }
      }
      
      console.log('Loaded progress:', data)
      console.log('Progress completed value:', data.completed, 'Type:', typeof data.completed)
      
      // Normalize completed to boolean
      const progressData = {
        ...data,
        completed: data.completed === true || data.completed === 'true' || data.completed === 1 || data.completed === '1'
      }
      
      return { success: true, progress: progressData }
    } catch (error) {
      console.error('Failed to load progress:', error)
      return { success: false, error: error.message }
    }
  }

  // Update lesson progress
  static async updateLessonProgress(userId, lessonId, progress) {
    try {
      console.log('Saving progress:', { userId, lessonId, progress })
      
      // Ensure completed is a proper boolean
      const completedValue = progress.completed === true || progress.completed === 'true' || progress.completed === 1 || progress.completed === '1'
      
      const progressData = {
        user_id: userId,
        lesson_id: lessonId,
        progress_percentage: progress.progress_percentage || 0,
        completed: completedValue, // Explicitly set as boolean
        last_watched_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('Saving progress data:', progressData, 'Completed value:', completedValue, typeof completedValue)
      
      const { data, error } = await supabase
        .from('lesson_progress')
        .upsert(progressData, {
          onConflict: 'user_id,lesson_id'
        })
        .select()

      if (error) {
        console.error('Error saving progress:', error)
        throw error
      }
      
      console.log('Progress saved successfully:', data)
      
      // Verify it was saved
      const verify = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .single()
      
      if (verify.data) {
        console.log('✅ Verified saved progress:', verify.data)
        console.log('✅ Completed value:', verify.data.completed, 'Type:', typeof verify.data.completed)
      } else {
        console.error('❌ Progress not found after save!', verify.error)
      }
      
      return { success: true, data }
    } catch (error) {
      console.error('Failed to save progress:', error)
      return { success: false, error: error.message }
    }
  }

  // Get course progress summary
  static async getCourseProgress(userId, courseId) {
    try {
      console.log('Loading course progress:', { userId, courseId })
      
      // Get all lessons for the course
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', courseId)

      if (lessonsError) {
        console.error('Error loading lessons:', lessonsError)
        throw lessonsError
      }

      console.log('Found lessons:', lessons?.length || 0)

      if (!lessons || lessons.length === 0) {
        console.warn('No lessons found for course:', courseId)
        return {
          success: true,
          progress: {
            completed: 0,
            total: 0,
            percentage: 0,
            lessons: []
          }
        }
      }

      const total = lessons.length
      const lessonIds = lessons.map(l => l.id)
      console.log('Lesson IDs to check:', lessonIds)

      // Get progress for all lessons
      const { data: progress, error: progressError } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds)

      if (progressError) {
        console.error('Error loading progress:', progressError)
        // Don't throw, return with 0 completed but correct total
        return {
          success: true,
          progress: {
            completed: 0,
            total: total,
            percentage: 0,
            lessons: []
          }
        }
      }

      console.log('Loaded progress records:', progress?.length || 0)
      if (progress && progress.length > 0) {
        console.log('Progress details:', progress.map(p => ({
          lesson_id: p.lesson_id,
          completed: p.completed,
          completed_type: typeof p.completed
        })))
      }

      // Count completed lessons - check for boolean true explicitly
      // Also handle cases where completed might be stored as string 'true', boolean true, or number 1
      const completed = progress ? progress.filter(p => {
        const isCompleted = p.completed === true || p.completed === 'true' || p.completed === 1 || p.completed === '1'
        if (isCompleted) {
          console.log(`✅ Lesson ${p.lesson_id}: completed=${p.completed} (${typeof p.completed})`)
        }
        return isCompleted
      }).length : 0
      
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
      console.log(`📊 Course ${courseId}: ${completed} completed out of ${total} total lessons (${percentage}%)`)

      return {
        success: true,
        progress: {
          completed,
          total,
          percentage,
          lessons: progress || []
        }
      }
    } catch (error) {
      console.error('Failed to get course progress:', error)
      return { 
        success: false, 
        error: error.message,
        progress: {
          completed: 0,
          total: 0,
          percentage: 0,
          lessons: []
        }
      }
    }
  }
}



