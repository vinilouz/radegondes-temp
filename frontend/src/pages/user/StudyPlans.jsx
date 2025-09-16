import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { SkeletonCards } from '../../components/Skeleton';

function Planos() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  useEffect(() => {
    document.title = 'Studies - Radegondes';
    fetchPlans();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
    };

    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDropdown]);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/study-plans`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      } else {
        console.error('Error fetching study plans');
      }
    } catch (error) {
      console.error('Error fetching study plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getInstitutionLogo = (acronym) => {
    // Placeholder for now
    return acronym;
  };

  const createCustomPlan = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/study-plans`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Custom Study',
          description: 'Custom study plan created by user'
        })
      });

      if (response.ok) {
        const newPlan = await response.json();
        fetchPlans();
        navigate(`/study-plans/${newPlan._id}?edit=true`);
      } else {
        const errorData = await response.json();
        console.error('Error creating custom study plan:', errorData.message || 'Unknown error');
        alert('Error creating custom study plan. Please try again.');
      }
    } catch (error) {
      console.error('Error creating custom study plan:', error);
      alert('Connection error. Please check your internet and try again.');
    }
  };

  const removePlan = async (planId, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (confirm('Are you sure you want to remove this study? This action cannot be undone.')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/study-plans/${planId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          setPlans(plans.filter(plan => plan._id !== planId));
          setActiveDropdown(null);
        } else {
          console.error('Error removing study plan');
          alert('Error removing study plan. Please try again.');
        }
      } catch (error) {
        console.error('Error removing study plan:', error);
        alert('Connection error. Please check your internet and try again.');
      }
    }
  };

  const toggleDropdown = (planId, event) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveDropdown(activeDropdown === planId ? null : planId);
  };

  const handleDragStart = (e, plan) => {
    setDraggedItem(plan);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
  };

  const handleDragOver = (e, plan) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedItem && draggedItem._id !== plan._id) {
      setDragOverItem(plan);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverItem(null);
    }
  };

  const handleDrop = async (e, targetPlan) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem._id === targetPlan._id) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    try {
      const currentOrder = [...plans];
      const draggedIndex = currentOrder.findIndex(p => p._id === draggedItem._id);
      const targetIndex = currentOrder.findIndex(p => p._id === targetPlan._id);
      
      const [draggedPlan] = currentOrder.splice(draggedIndex, 1);
      currentOrder.splice(targetIndex, 0, draggedPlan);
      
      const reorderData = currentOrder.map((plan, index) => ({
        id: plan._id,
        position: index + 1
      }));

      const response = await fetch(`${API_BASE_URL}/api/study-plans/reorder`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plans: reorderData })
      });

      if (response.ok) {
        await fetchPlans();
        console.log(`"${draggedItem.name}" moved to the position of "${targetPlan.name}"`);
      } else {
        console.error('Error saving new order');
        alert('Error saving new order. Please try again.');
      }
    } catch (error) {
      console.error('Error reordering plans:', error);
      alert('Connection error. Please check your internet and try again.');
    }
    
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  if (loading) {
    return (
      <>
        <header className='flex flex-col head'>
          <h1>Estudos</h1>
          <p style={{ margin: '8px 0 0 0', color: 'var(--darkmode-text-secondary)' }}>
            Organize e acompanhe seu progresso nos estudos
          </p>
        </header>
        <SkeletonCards count={3} />
      </>
    );
  }

  return (
    <>
      <header className='flex flex-col head'>
        <h1>Estudos</h1>
      </header>

      {/* Botões de criação */}
      <div className="new-items-container">
        {/* <div className='new-item'>
          <Link to="/planos/novo">
            <div className="new-item-content">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="#E66912" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="#E66912" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 13H8" stroke="#E66912" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17H8" stroke="#E66912" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 9H9H8" stroke="#E66912" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="new-item-text">
                <h5>Criar Novo Estudo</h5>
                <p>Crie um novo estudo para adicionar disciplinas a partir de editais específicos.</p>
              </div>
            </div>
          </Link>
        </div> */}
        
        <div className='new-item'>
          <div className="custom-plan-button" onClick={createCustomPlan}>
            <div className="new-item-content">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" stroke="#E66912" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="new-item-text">
                <h5>Criar Estudo Personalizado</h5>
                <p>Crie rapidamente um estudo personalizado sem seleção de editais.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Estudos */}
      {plans.length > 0 && (
        <>
          <style>
            {`
              .study-card {
                position: relative;
                background: var(--darkmode-bg-secondary);
                border: 1px solid var(--darkmode-border-secondary);
                border-radius: 12px;
                padding: 20px;
                text-decoration: none;
                color: inherit;
                display: block;
                transition: all 0.2s ease;
                overflow: hidden;
                cursor: grab;
              }
              
              .study-card:active {
                cursor: grabbing;
              }
              
              .study-card.dragging {
                opacity: 0.8;
                transform: rotate(-8deg) scale(0.95) translateY(-8px);
                box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4), 0 5px 15px rgba(0, 0, 0, 0.2);
                z-index: 1000;
                position: relative;
                border-color: var(--orange-primary);
                transition: none;
                cursor: grabbing;
                animation: liftCard 0.2s ease-out;
              }
              
              @keyframes liftCard {
                0% {
                  transform: rotate(0deg) scale(1) translateY(0px);
                  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                }
                100% {
                  transform: rotate(-8deg) scale(0.95) translateY(-8px);
                  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4), 0 5px 15px rgba(0, 0, 0, 0.2);
                }
              }
              
              .study-card.drag-over {
                border-color: var(--orange-primary);
                background: rgba(255, 107, 53, 0.08);
                transform: scale(1.02);
                box-shadow: 0 4px 20px rgba(255, 107, 53, 0.2);
                border-width: 2px;
                opacity: 0.9;
              }
              
              .study-card.drag-over::before {
                content: 'Drop here';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 107, 53, 0.9);
                color: white;
                padding: 6px 16px;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 600;
                white-space: nowrap;
                z-index: 1001;
                backdrop-filter: blur(4px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
              }
              
              .study-card:hover:not(.dragging) {
                transform: translateY(-3px);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
                border-color: var(--orange-primary);
              }
              
              .study-header {
                margin-bottom: 16px;
              }
              
              .study-title {
                font-size: 16px;
                font-weight: 600;
                color: var(--darkmode-text-primary);
                margin: 0;
                line-height: 1.3;
                padding-right: 40px;
              }
              
              .ellipsis-menu {
                position: absolute;
                top: 16px;
                right: 16px;
                z-index: 10;
              }
              
              .trash-icon {
                position: absolute;
                top: 18px;
                right: 16px;
                z-index: 10;
                opacity: 0.5;
                color: #EF4444;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s ease;
                background: rgba(239, 68, 68, 0.1);
              }
              
              .trash-icon:hover {
                opacity: 1;
                background: rgba(239, 68, 68, 0.2);
              }
              
              .ellipsis-button {
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                color: var(--darkmode-text-secondary);
                transition: all 0.2s ease;
                opacity: 0.7;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              
              .ellipsis-button:hover {
                background: var(--darkmode-bg-tertiary);
                color: var(--darkmode-text-primary);
                opacity: 1;
              }
              
              .dropdown-menu {
                position: absolute;
                top: 100%;
                right: 0;
                background: var(--darkmode-bg-secondary);
                border: 1px solid var(--darkmode-border-secondary);
                border-radius: 8px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
                min-width: 120px;
                z-index: 1000;
                overflow: hidden;
                margin-top: 4px;
              }
              
              .dropdown-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 16px;
                background: none;
                border: none;
                width: 100%;
                text-align: left;
                cursor: pointer;
                color: #EF4444;
                font-size: 14px;
                transition: all 0.2s ease;
                opacity: 0.7;
              }
              
              .dropdown-item:hover {
                background: rgba(239, 68, 68, 0.1);
                opacity: 1;
              }
              
              .study-stat {
                text-align: center;
              }
              
              .study-stat-value {
                font-size: 20px;
                font-weight: 700;
                color: var(--orange-primary);
                margin-bottom: 4px;
              }
              
              .study-stat-label {
                font-size: 12px;
                color: var(--darkmode-text-secondary);
                text-transform: uppercase;
                font-weight: 500;
              }
              
              .study-footer {
                padding-top: 12px;
                border-top: 1px solid var(--darkmode-border-secondary);
                font-size: 12px;
                color: var(--darkmode-text-tertiary);
              }
              
              .studies-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 20px;
              }
            `}
          </style>
          <div className="studies-grid">
            {plans.map((plan) => {
              return (
                <Link
                  key={plan._id}
                  to={`/study-plans/${plan._id}`}
                  className={`study-card ${draggedItem && draggedItem._id === plan._id ? 'dragging' : ''} ${dragOverItem && dragOverItem._id === plan._id ? 'drag-over' : ''}`}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, plan)}
                  onDragOver={(e) => handleDragOver(e, plan)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, plan)}
                  onDragEnd={handleDragEnd}
                  onClick={(e) => {
                    if (draggedItem) {
                      e.preventDefault();
                    }
                  }}
                >
                  <div className="ellipsis-menu">
                    <button 
                      className="ellipsis-button"
                      onClick={(e) => toggleDropdown(plan._id, e)}
                    >
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                    
                    {activeDropdown === plan._id && (
                      <div className="dropdown-menu">
                        <button 
                          className="dropdown-item"
                          onClick={(e) => removePlan(plan._id, e)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="trash-icon" onClick={(e) => removePlan(plan._id, e)}>
                    <i className="fas fa-trash"></i>
                  </div>

                  <div className="study-header">
                    <h3 className="study-title">
                      {plan.name}
                    </h3>
                  </div>

                  <div className="study-stats">
                    <div className="study-stat">
                      <div className="study-stat-value">
                        {plan.subjectCount || 0}
                      </div>
                      <div className="study-stat-label">
                        Subjects
                      </div>
                    </div>
                    
                    <div className="study-stat">
                      <div className="study-stat-value">
                        {plan.topicCount || 0}
                      </div>
                      <div className="study-stat-label">
                        Topics
                      </div>
                    </div>
                  </div>

                  <div className="study-footer">
                    <span>
                      Created on {formatDate(plan.createdAt)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {plans.length === 0 && (
        <div className="empty-studies-state">
          <div className="empty-studies-icon">
            📋
          </div>
          <h3 className="empty-studies-title">
            No studies created yet
          </h3>
          <p className="empty-studies-text">
            Start by creating your first study using the button above.
          </p>
        </div>
      )}

      {/* Botão Flutuante para Estudo Personalizado */}
      {/* <button 
        className="fab-button"
        onClick={criarPlanoPersonalizado}
        title="Criar Estudo Personalizado"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" fill="white" strokeWidth="0"/>
        </svg>
        <span className="fab-text">Estudo Personalizado</span>
      </button> */}
    </>
  );
}

export default Planos;
