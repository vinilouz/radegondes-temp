import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { SkeletonStats, SkeletonList } from '../../components/Skeleton';

function Statistics() {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    totalPlans: 0,
    totalSubjects: 0,
    totalTopics: 0,
    totalQuestions: 0,
    correctQuestions: 0,
    totalStudyTime: 0,
    totalStudyLogs: 0,
    totalReviews: 0,
    recentPlans: [],
    mostStudiedSubjects: [],
    studyTimeByMonth: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Statistics - Radegondes';
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      const [plansRes, logsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/study-plans`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/study-logs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const plans = plansRes.ok ? await plansRes.json() : [];
      const logsData = logsRes.ok ? await logsRes.json() : { studyLogs: [] };
      const logs = logsData.studyLogs || logsData;

      console.log('📊 Data collected:', {
        plans: plans.length,
        logs: logs.length
      });

      const totalPlans = Array.isArray(plans) ? plans.length : 0;
      
      const uniqueSubjects = new Set();
      plans.forEach(plan => {
        if (plan.subjects && Array.isArray(plan.subjects)) {
          plan.subjects.forEach(subject => {
            uniqueSubjects.add(subject._id || subject.id || subject);
          });
        }
      });
      const totalSubjects = uniqueSubjects.size;

      const uniqueTopics = new Set();
      logs.forEach(log => {
        if (log.topic?.name && log.topic.name.trim() !== '') {
          uniqueTopics.add(`${log.topic.subject}-${log.topic.name.trim()}`);
        }
      });
      const totalTopics = uniqueTopics.size;

      const totalStudyTime = logs.reduce((total, log) => {
        if (log.duration && !isNaN(log.duration)) {
          return total + Number(log.duration);
        }
        return total;
      }, 0);

      const validLogs = logs.filter(l => l.topic?.name && l.topic.name.trim() !== '');
      const totalStudyLogs = validLogs.length;

      const totalReviews = logs.filter(l =>
        l.dateOption === 'schedule' && l.scheduledDate && l.scheduledDate.trim() !== ''
      ).length;

      const totalQuestions = logs.reduce((total, log) => {
        if (log.questionsCompleted && !isNaN(log.questionsCompleted)) {
          return total + Number(log.questionsCompleted);
        }
        return total;
      }, 0);

      const lastLogByTopic = {};
      logs.forEach(log => {
        if (log.topic?.name && log.topic.name.trim() !== '') {
          const topicKey = `${log.topic.subject}-${log.topic.name.trim()}`;
          const logDate = new Date(log.createdAt || log.date || Date.now());
          
          if (!lastLogByTopic[topicKey] ||
              new Date(lastLogByTopic[topicKey].createdAt || lastLogByTopic[topicKey].date || 0) < logDate) {
            lastLogByTopic[topicKey] = log;
          }
        }
      });

      const correctQuestions = Object.values(lastLogByTopic).reduce((total, log) => {
        if (log.questionsCompleted && !isNaN(log.questionsCompleted)) {
          return total + Number(log.questionsCompleted);
        }
        return total;
      }, 0);

      console.log('📈 Calculated Statistics:', {
        totalPlans,
        totalSubjects,
        totalTopics,
        totalQuestions,
        correctQuestions,
        totalStudyTime,
        totalStudyLogs,
        totalReviews
      });

      setStats({
        totalPlans,
        totalSubjects,
        totalTopics,
        totalQuestions,
        correctQuestions,
        totalStudyTime,
        totalStudyLogs,
        totalReviews,
        recentPlans: [],
        mostStudiedSubjects: [],
        studyTimeByMonth: []
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setStats({
        totalPlans: 0,
        totalSubjects: 0,
        totalTopics: 0,
        totalQuestions: 0,
        correctQuestions: 0,
        totalStudyTime: 0,
        totalStudyLogs: 0,
        totalReviews: 0,
        recentPlans: [],
        mostStudiedSubjects: [],
        studyTimeByMonth: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    
    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    } else if (minutos > 0) {
      return `${minutos}m`;
    } else {
      return `${segundos}s`;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US');
  };

  if (loading) {
    return (
      <>
        <header className='flex flex-col head'>
          <h1>Statistics</h1>
          <p style={{ margin: '8px 0 0 0', color: 'var(--darkmode-text-secondary)' }}>
            Track your progress and performance
          </p>
        </header>
        
        <SkeletonStats count={6} />
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '30px',
          marginTop: '30px'
        }}>
          <div>
            <div style={{ 
              height: '24px', 
              width: '200px', 
              background: 'linear-gradient(90deg, var(--darkmode-bg-secondary) 25%, var(--darkmode-bg-tertiary) 50%, var(--darkmode-bg-secondary) 75%)',
              backgroundSize: '200% 100%',
              animation: 'skeleton-loading 1.5s infinite',
              borderRadius: '4px',
              marginBottom: '20px'
            }} />
            <SkeletonList count={3} />
          </div>
          
          <div>
            <div style={{ 
              height: '24px', 
              width: '250px', 
              background: 'linear-gradient(90deg, var(--darkmode-bg-secondary) 25%, var(--darkmode-bg-tertiary) 50%, var(--darkmode-bg-secondary) 75%)',
              backgroundSize: '200% 100%',
              animation: 'skeleton-loading 1.5s infinite',
              borderRadius: '4px',
              marginBottom: '20px'
            }} />
            <SkeletonList count={3} />
          </div>
        </div>
        
        <style>
          {`
            @keyframes skeleton-loading {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}
        </style>
      </>
    );
  }

  return (
    <>
      <header className='flex flex-col head'>
        <h1>Statistics</h1>
        <p>Track your progress and performance in your studies</p>
      </header>

      {/* General Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: '40px' }}>
        <div className="stat-card">
          <div className="stat-label" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            justifyContent: 'center'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2V8H20" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Total Studies
          </div>
          <div className="stat-value" style={{ textAlign: 'center' }}>
            {stats.totalPlans}
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            justifyContent: 'center'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 6H21M8 12H21M8 18H21M3 6.5H4V5.5H3V6.5ZM3 12.5H4V11.5H3V12.5ZM3 18.5H4V17.5H3V18.5Z" stroke="#FF6B35" strokeWidth="2"/>
            </svg>
            Topics Studied
          </div>
          <div className="stat-value-orange" style={{ textAlign: 'center' }}>
            {stats.totalTopics}
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            justifyContent: 'center'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Total Study Time
          </div>
          <div className="stat-value" style={{ textAlign: 'center' }}>
            {formatTime(stats.totalStudyTime)}
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            justifyContent: 'center'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Correct Questions
          </div>
          <div className="stat-value-success" style={{ textAlign: 'center' }}>
            {stats.correctQuestions}
          </div>
        </div>
      </div>

      {/* Weekly Analysis Charts */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '30px',
        marginBottom: '40px'
      }}>
        
        <div className="chart-section">
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '20px',
            color: 'var(--darkmode-text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📊 Weekly Performance
          </h3>
          <div style={{
            background: 'var(--darkmode-bg-secondary)',
            border: '1px solid var(--darkmode-border-secondary)',
            borderRadius: '12px',
            padding: '20px',
            minHeight: '250px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}>
            {stats.totalStudyLogs > 0 ? (
              <div style={{ width: '100%', height: '200px', position: 'relative' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'end',
                  justifyContent: 'space-around',
                  height: '160px',
                  borderBottom: '1px solid var(--darkmode-border-secondary)',
                  gap: '8px'
                }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                    const dailyLogs = Math.floor(Math.random() * 5) + 1; // Mock data
                    const barHeight = Math.max(20, (dailyLogs / 5) * 120);
                    return (
                      <div key={day} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        flex: 1
                      }}>
                        <div className="chart-bar" style={{
                          background: `linear-gradient(180deg, var(--orange-primary), ${index % 2 === 0 ? '#FF8A65' : '#FF7043'})`,
                          width: '100%',
                          maxWidth: '40px',
                          height: `${barHeight}px`,
                          borderRadius: '4px 4px 0 0',
                          marginBottom: '8px',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <span style={{
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: '600'
                          }}>
                            {dailyLogs}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '11px',
                          color: 'var(--darkmode-text-tertiary)',
                          fontWeight: '500'
                        }}>
                          {day}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div style={{
                  textAlign: 'center',
                  marginTop: '12px',
                  fontSize: '12px',
                  color: 'var(--darkmode-text-secondary)'
                }}>
                  Study sessions per day of the week
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--darkmode-text-secondary)' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
                <p>No performance data yet</p>
                <p style={{ fontSize: '12px' }}>Start studying to see your progress</p>
              </div>
            )}
          </div>
        </div>

        <div className="chart-section">
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '20px',
            color: 'var(--darkmode-text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ⏱️ Weekly Study Time
          </h3>
          <div style={{
            background: 'var(--darkmode-bg-secondary)',
            border: '1px solid var(--darkmode-border-secondary)',
            borderRadius: '12px',
            padding: '20px',
            minHeight: '250px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}>
            {stats.totalStudyTime > 0 ? (
              <div style={{ width: '100%', height: '200px', position: 'relative' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'end',
                  justifyContent: 'space-around',
                  height: '160px',
                  borderBottom: '1px solid var(--darkmode-border-secondary)',
                  gap: '8px'
                }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                    const timeInMinutes = Math.floor(Math.random() * 120) + 30; // Mock data
                    const barHeight = Math.max(20, (timeInMinutes / 150) * 120);
                    return (
                      <div key={day} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        flex: 1
                      }}>
                        <div className="chart-bar" style={{
                          background: `linear-gradient(180deg, #4CAF50, ${index % 2 === 0 ? '#66BB6A' : '#81C784'})`,
                          width: '100%',
                          maxWidth: '40px',
                          height: `${barHeight}px`,
                          borderRadius: '4px 4px 0 0',
                          marginBottom: '8px',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <span style={{
                            color: 'white',
                            fontSize: '9px',
                            fontWeight: '600',
                            textAlign: 'center',
                            lineHeight: '1'
                          }}>
                            {timeInMinutes}m
                          </span>
                        </div>
                        <span style={{
                          fontSize: '11px',
                          color: 'var(--darkmode-text-tertiary)',
                          fontWeight: '500'
                        }}>
                          {day}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div style={{
                  textAlign: 'center',
                  marginTop: '12px',
                  fontSize: '12px',
                  color: 'var(--darkmode-text-secondary)'
                }}>
                  Total time studied per day (minutes)
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--darkmode-text-secondary)' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏱️</div>
                <p>No time logged yet</p>
                <p style={{ fontSize: '12px' }}>Start timing your studies</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Statistics;
