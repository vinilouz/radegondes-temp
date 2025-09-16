import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import MainLayout from '../../components/MainLayout';
import SubjectDetails from './SubjectDetails';

function SubjectDetailsWithBreadcrumb() {
  const { planId, subjectId } = useParams();
  const { user, authenticatedFetch } = useAuth();
  const [plan, setPlan] = useState();
  const [subject, setSubject] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlanInfo = async () => {
      try {
        setLoading(true);
        const response = await authenticatedFetch(`${API_BASE_URL}/api/study-plans/${planId}`);

        if (response && response.ok) {
          const planData = await response.json();
          setPlan(planData);

          // Find the specific subject in the new structure
          const foundSubject = planData.subjects?.find(s => s._id === subjectId);
          setSubject(foundSubject);
        }
      } catch (error) {
        console.error('Error fetching plan info:', error);
      } finally {
        setLoading(false);
      }
    };

    if (planId && subjectId && authenticatedFetch) {
      fetchPlanInfo();
    }
  }, [planId, subjectId, authenticatedFetch]);

  const breadcrumbItems = [
    { label: 'Studies', path: '/study-plans' },
    {
      label: (plan && plan.name) ? plan.name : (loading ? 'Loading...' : 'Plan'),
      path: `/study-plans/${planId}`
    },
    {
      label: (subject && subject.name) ? subject.name : (loading ? 'Loading...' : 'Subject')
    }
  ];

  return (
    <MainLayout breadcrumbItems={breadcrumbItems}>
      <SubjectDetails />
    </MainLayout>
  );
}

export default SubjectDetailsWithBreadcrumb;
