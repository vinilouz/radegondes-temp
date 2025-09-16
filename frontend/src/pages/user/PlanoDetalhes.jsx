/* eslint-disable */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import ColorPicker from '../../components/ColorPicker';
import { CORES_DISCIPLINAS } from '../../data/cores';
import { SkeletonStats, SkeletonList } from '../../components/Skeleton';

const cores = {
  azul: 'var(--darkmode-text-link)',
  verde: '#10B981',
  vermelho: '#EF4444',
  amarelo: '#F59E0B',
  roxo: '#8B5CF6',
  laranja: '#F97316',
  rosa: '#EC4899',
  cinza: 'var(--darkmode-text-secondary)'
};

function PlanoDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [plan, setPlan] = useState({
    name: '',
    description: '',
    subjects: [],
    subjectCount: 0,
    topicCount: 0,
    totalStudyTime: 0,
    totalQuestions: 0,
  });
  const [tempoDeEstudos, setTempoDeEstudos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [menuAberto, setMenuAberto] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditDisciplinaModal, setShowEditDisciplinaModal] = useState(false);
  const [showNovaDisciplinaModal, setShowNovaDisciplinaModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: ''
  });
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(null);
  const [formDataDisciplina, setFormDataDisciplina] = useState({
    nome: '',
    cor: 'azul',
    topicos: []
  });
  const [formDataNovaDisciplina, setFormDataNovaDisciplina] = useState({
    nome: '',
    cor: 'azul',
    topicos: []
  });
  const [editandoTopico, setEditandoTopico] = useState(null);
  const [novoTopico, setNovoTopico] = useState('');

  const [statusDisciplinas, setStatusDisciplinas] = useState({});
  const [topicosAgendados, setTopicosAgendados] = useState({});
  const [jaVerificouModal, setJaVerificouModal] = useState(false);

  useEffect(() => {
    document.title = 'Study Details - Radegondes';
    fetchPlan();
    fetchStatusDisciplinas();
    fetchTopicosAgendados();

    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('edit') === 'true') {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [id]);

  // Estado específico para controlar a abertura automática do modal
  const [deveAbrirModalAutomatico, setDeveAbrirModalAutomatico] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const shouldEdit = searchParams.get('edit') === 'true';

    if (shouldEdit && !jaVerificouModal) {
      console.log('🎯 Edit parameter detected, setting up modal...');

      // Limpar URL imediatamente
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      setJaVerificouModal(true);
      setDeveAbrirModalAutomatico(true);
    }
  }, [id]); // Mudança: depender apenas do id, não do location.search

  // Effect separado para abrir o modal quando o plan estiver carregado
  useEffect(() => {
    if (deveAbrirModalAutomatico && plan && plan.name && !loading && !showEditModal) {
      console.log('🎯 Checking if modal should open for loaded plan...');

      const isPersonalizado = isPlanoPersonalizado(plan);
      const semDisciplinas = !plan.subjects || plan.subjects.length === 0;

      console.log('🔍 Final checks:', {
        isPersonalizado,
        semDisciplinas,
        subjects: plan.subjects,
        shouldOpenModal: isPersonalizado && semDisciplinas
      });

      if (isPersonalizado && semDisciplinas) {
        console.log('✅ OPENING MODAL AUTOMATICALLY!');

        const timer = setTimeout(() => {
          console.log('⏰ Timer executed, opening modal...');
          setShowEditModal(true);
          setIsClosing(false);
          setDeveAbrirModalAutomatico(false); // Reset flag
        }, 300);

        return () => {
          console.log('🧹 Clearing timer...');
          clearTimeout(timer);
        };
      } else {
        console.log('❌ Not opening modal automatically');
        setDeveAbrirModalAutomatico(false); // Reset flag mesmo se não abrir
      }
    }
  }, [deveAbrirModalAutomatico, plan, loading, showEditModal]);

  // Função para verificar se um tópico está agendado
  const verificarTopicoAgendado = (disciplinaId, nomeTopico) => {
    const chave = `${disciplinaId}_${nomeTopico}`;
    return topicosAgendados[chave];
  };

  const fetchStatusDisciplinas = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/registros-estudo?limit=1000`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const registros = data.registros || [];

        const statusMap = {};

        registros.forEach(registro => {
          if (registro.disciplinaId && registro.tempoEstudo > 0) {
            statusMap[registro.disciplinaId] = true;
          }
        });
        if (data && Array.isArray(data.registros)) {
          const registrosDoPlano = data.registros.filter(registro => registro.plano === id);
          const totalTempoEstudo = registrosDoPlano
            .filter(registro => registro.tempoEstudo != null)
            .reduce((acc, registro) => acc + registro.tempoEstudo, 0);
          setTempoDeEstudos(formatarTempo(totalTempoEstudo));
        }
        setStatusDisciplinas(statusMap);

      }
    } catch (error) {
      console.error('Erro ao buscar status das disciplinas:', error);
    }
  };

  const fetchTopicosAgendados = async () => {
    if (!token) return;

    try {
      // Buscar registros de estudo com agendamento
      const response = await fetch(`${API_BASE_URL}/api/registros-estudo?dataOpcao=agendar&limit=1000`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Criar um mapa de tópicos agendados por disciplina e tópico
        const agendados = {};
        (data.registros || []).forEach(registro => {
          if (registro.dataAgendada && registro.disciplinaId && registro.topico) {
            const chave = `${registro.disciplinaId}_${registro.topico}`;
            agendados[chave] = {
              dataAgendada: registro.dataAgendada,
              horarioAgendado: registro.horarioAgendado || ''
            };
          }
        });
        setTopicosAgendados(agendados);
      }
    } catch (error) {
      console.error('Erro ao buscar tópicos agendados:', error);
    }
  };

  const fetchPlan = async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`${API_BASE_URL}/api/study-plans/${id}?_t=${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPlan(data);
        setFormData({
          name: data.name,
          description: data.description || 'No description'
        });
        document.title = `${data.name} - Radegondes`;
      } else if (response.status === 404) {
        navigate('/study-plans');
      } else {
        const errorText = await response.text();
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const isDisciplineBeingStudied = (subject) => {
    return statusDisciplinas[subject._id] || false;
  };

  const isCustomPlan = (plan) => {
    // A custom plan is now defined as one that has no subjects associated with it initially.
    // The old logic was based on a special 'Edital' name.
    // This is a simplification and may need adjustment based on the new backend logic.
    return !plan?.subjects || plan.subjects.length === 0;
  };

  const openEditModal = () => {
    setJaVerificouModal(true);
    setShowEditModal(true);
    setIsClosing(false);
  };

  const handleNovaDisciplina = () => {
    setFormDataNovaDisciplina({
      nome: '',
      cor: 'azul',
      topicos: []
    });
    setShowNovaDisciplinaModal(true);
  };

  const closeEditModal = () => {
    setJaVerificouModal(true);
    setIsClosing(true);

    setTimeout(() => {
      setShowEditModal(false);
      setIsClosing(false);
    }, 300);
  };

  const handleViewSubject = (subject) => {
    navigate(`/study-plans/${id}/subjects/${subject._id}`);
  };

  const handleEditSubject = (subject) => {
    setSelectedSubject(subject);
    setSubjectFormData({
      name: subject.name,
      color: subject.color,
      topics: subject.topics || []
    });
    setShowEditDisciplinaModal(true);
  };

  const closeEditDisciplinaModal = () => {
    setShowEditDisciplinaModal(false);
    setSelectedSubject(null);
    setSubjectFormData({ name: '', color: 'blue', topics: [] });
    setEditandoTopico(null);
    setNovoTopico('');
  };

  const handleAddTopic = () => {
    if (novoTopico.trim()) {
      const topicExists = subjectFormData.topics.includes(novoTopico.trim());
      if (topicExists) {
        alert('This topic already exists!');
        return;
      }
      setSubjectFormData(prev => ({
        ...prev,
        topics: [...prev.topics, novoTopico.trim()]
      }));
      setNovoTopico('');
    }
  };

  const handleEditTopic = (index, newText) => {
    setSubjectFormData(prev => ({
      ...prev,
      topics: prev.topics.map((topic, i) => i === index ? newText : topic)
    }));
    setEditandoTopico(null);
  };

  const handleRemoveTopic = (index) => {
    setSubjectFormData(prev => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== index)
    }));
  };

  const handleEditSubjectSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSubject) {
      alert('No subject selected!');
      return;
    }

    try {
      const url = `${API_BASE_URL}/api/study-plans/${id}/subjects/${selectedSubject._id}`;

      const requestData = {
        name: subjectFormData.name,
        color: subjectFormData.color,
        topics: subjectFormData.topics
      };

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        await fetchPlan();
        closeEditDisciplinaModal();
        alert('Subject updated successfully!');
      } else {
        const errorText = await response.text();
        alert(`Error updating subject: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      alert(`Error updating subject: ${error.message}`);
    }
  };

  const handleSaveNewSubject = async () => {
    if (!formDataNovaDisciplina.nome.trim()) {
      alert('Please enter a subject name.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/study-plans/${id}/subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            name: formDataNovaDisciplina.nome,
            color: formDataNovaDisciplina.cor,
            topics: formDataNovaDisciplina.topicos
        })
      });

      if (response.ok) {
        await fetchPlan();
        closeNovaDisciplinaModal();
        alert('New subject created successfully!');
      } else {
        const errorData = await response.text();
        alert(`Error creating subject: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      alert(`Error creating subject: ${error.message}`);
    }
  };

  const handleAddNewSubjectTopic = () => {
    if (novoTopico.trim()) {
      const topicExists = formDataNovaDisciplina.topicos.includes(novoTopico.trim());
      if (topicExists) {
        alert('This topic already exists!');
        return;
      }
      setFormDataNovaDisciplina(prev => ({
        ...prev,
        topicos: [...prev.topicos, novoTopico.trim()]
      }));
      setNovoTopico('');
    }
  };

  const handleEditNewSubjectTopic = (index, newText) => {
    setFormDataNovaDisciplina(prev => ({
      ...prev,
      topicos: prev.topicos.map((topico, i) => i === index ? newText : topico)
    }));
  };

  const handleRemoveNewSubjectTopic = (index) => {
    setFormDataNovaDisciplina(prev => ({
      ...prev,
      topicos: prev.topics.filter((_, i) => i !== index)
    }));
  };

  const closeNewSubjectModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowNovaDisciplinaModal(false);
      setIsClosing(false);
      setFormDataNovaDisciplina({
        nome: '',
        cor: 'azul',
        topicos: []
      });
      setNovoTopico('');
    }, 250);
  };

  const handleRemoveSubject = async (subject) => {
    const confirmDelete = window.confirm(`Are you sure you want to remove the subject "${subject.name}" from the study?`);

    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/study-plans/${id}/subjects/${subject._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Subject removed successfully!');
        await fetchPlan();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error removing subject. Please try again.');
      }
    } catch (error) {
      console.error('Error removing subject:', error);
      alert(`Connection error: ${error.message}.`);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE_URL}/api/study-plans/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchPlan();
        closeEditModal();
      } else {
        // Handle error
      }
    } catch (error) {
      // Handle error
    }
  };

  const handleDeletePlan = async () => {
    if (!plan.name) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete the study plan "${plan.name}"? This action cannot be undone.`);

    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/study-plans/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Study plan deleted successfully!');
        navigate('/study-plans');
      } else {
        alert('Error deleting study plan. Please try again.');
      }
    } catch (error) {
      alert('Error deleting study plan. Please try again.');
    }
  };

  const formatTime = (seconds) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segundosRestantes = segundos % 60;

    if (horas > 0) {
      return `${horas}h ${minutos.toString().padStart(2, '0')}m ${segundosRestantes.toString().padStart(2, '0')}s`;
    } else if (minutos > 0) {
      return `${minutos}m ${segundosRestantes.toString().padStart(2, '0')}s`;
    } else {
      return `${segundosRestantes}s`;
    }
  };

  if (loading) {
    return (
      <>
        <header className='flex flex-col head'>
          <div style={{
            height: '32px',
            width: '200px',
            background: 'linear-gradient(90deg, var(--darkmode-bg-secondary) 25%, var(--darkmode-bg-tertiary) 50%, var(--darkmode-bg-secondary) 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeleton-loading 1.5s infinite',
            borderRadius: '4px',
            marginBottom: '8px'
          }} />
          <div style={{
            height: '16px',
            width: '300px',
            background: 'linear-gradient(90deg, var(--darkmode-bg-secondary) 25%, var(--darkmode-bg-tertiary) 50%, var(--darkmode-bg-secondary) 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeleton-loading 1.5s infinite',
            borderRadius: '4px'
          }} />
        </header>

        <SkeletonStats count={3} />
        <SkeletonList count={5} />

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

  if (!plan || !plan.name) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: '18px',
        color: 'var(--darkmode-text-secondary)'
      }}>
        Study Plan not found
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { 
              opacity: 0;
            }
            to { 
              opacity: 1;
            }
          }
          
          @keyframes fadeOut {
            from { 
              opacity: 1;
            }
            to { 
              opacity: 0;
            }
          }
          
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(30px) scale(0.98);
            }
            to { 
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          @keyframes slideDown {
            from { 
              opacity: 1;
              transform: translateY(0) scale(1);
            }
            to { 
              opacity: 0;
              transform: translateY(30px) scale(0.98);
            }
          }
          
          .modal-overlay {
            transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .modal-content {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .nova-disciplina-button:hover {
            background-color: #E66912 !important;
            color: var(--darkmode-text-primary) !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 8px rgba(230, 105, 18, 0.2) !important;
          }
          
          .edit-button:hover {
            background-color: var(--darkmode-text-secondary) !important;
            color: var(--darkmode-text-primary) !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 8px rgba(107, 114, 128, 0.2) !important;
          }
          
          .delete-button:hover {
            background-color: #EF4444 !important;
            color: var(--darkmode-text-primary) !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 8px rgba(239, 68, 68, 0.2) !important;
          }
          
          .disciplina-card {
            position: relative;
            transition: all 0.3s ease;
          }
          
          .disciplina-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4) !important;
          }
          
          .disciplina-actions {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.95);
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            border-radius: 12px;
          }
          
          .disciplina-card:hover .disciplina-actions {
            opacity: 1;
            visibility: visible;
          }
          
          .action-button {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 16px;
            background: var(--darkmode-bg-secondary);
            border: 2px solid var(--darkmode-border-secondary);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            min-width: 80px;
          }
          
          .action-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          }
          
          .action-button.visualizar:hover {
            border-color: var(--darkmode-text-link);
            color: var(--darkmode-text-link);
            background-color: var(--darkmode-bg-tertiary);
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
          }
          
          .action-button.editar:hover {
            border-color: #E66912;
            color: #E66912;
          }
          
          .action-button.remover:hover {
            border-color: #EF4444;
            color: #EF4444;
          }
        `}
      </style>
      <div className="plano-detalhes-container">
        {/* Header Hero Section */}
        <div className="plano-hero">
          <div className="plano-hero-content">
            <div className="plano-info">
              <h1 className="plano-hero-title">{plan.name}</h1>
              <p className="plano-hero-description">{plan.description || 'No description'}</p>
            </div>
            <div className="plano-actions">
              <button
                onClick={handleNewSubject}
                className="btn-primary-hero"
              >
                + New Subject
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openEditModal();
                }}
                className="btn-secondary-hero"
              >
                Edit
              </button>
              <button
                onClick={handleDeletePlan}
                className="btn-danger-hero"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="dashboard-stats">
          <div className="stat-card-dashboard">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 19.5C4 20.3284 4.67157 21 5.5 21H18.5C19.3284 21 20 20.3284 20 19.5V6.5C20 5.67157 19.3284 5 18.5 5H5.5C4.67157 5 4 5.67157 4 6.5V19.5Z" stroke="#E66912" strokeWidth="1.5" fill="none" />
                <path d="M7 9H17" stroke="#E66912" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M7 13H17" stroke="#E66912" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M7 17H14" stroke="#E66912" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-number">{plan.subjectCount || 0}</div>
              <div className="stat-label">Subjects</div>
            </div>
          </div>
          <div className="stat-card-dashboard">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="#E66912" strokeWidth="1.5" />
                <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z" stroke="#E66912" strokeWidth="1.5" />
                <path d="M9 12H15" stroke="#E66912" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M9 16H15" stroke="#E66912" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-number">
                {plan.topicCount || 0}
              </div>
              <div className="stat-label">Topics</div>
            </div>
          </div>
          <div className="stat-card-dashboard">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="9" stroke="#E66912" strokeWidth="1.5" />
                <path d="M12 7V12L16 16" stroke="#E66912" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-number">{formatTime(plan.totalStudyTime || 0)}</div>
              <div className="stat-label">Study Time</div>
            </div>
          </div>
        </div>

        {/* Subjects Section */}
        <div className="disciplinas-section">
          <div className="section-header">
            <h2 className="section-title">
              Subjects
            </h2>
            <div className="section-subtitle">
              Choose a subject to study
            </div>
          </div>

          <div className="disciplinas-list">
            {plan.subjects?.map((subject, index) => {
              const temAtividade = subject.studyTime > 0 || subject.questionsDone > 0;
              const topicosConcluidos = subject.topicsCompleted || 0;
              const topicosTotal = subject.topicCount || 0;
              const percentualConclusao = topicosTotal > 0 ? (topicosConcluidos / topicosTotal) * 100 : 0;

              const estaEstudando = isDisciplineBeingStudied(subject);

              let statusEstudo, statusCor;
              if (estaEstudando) {
                statusEstudo = 'Studying';
                statusCor = '#10B981';
              } else if (percentualConclusao >= 100) {
                statusEstudo = 'Completed';
                statusCor = '#10B981';
              } else if (temAtividade) {
                statusEstudo = 'In Progress';
                statusCor = '#E66912';
              } else {
                statusEstudo = 'Not Started';
                statusCor = 'var(--darkmode-text-secondary)';
              }

              return (
                <div
                  key={subject._id}
                  className="disciplina-card-horizontal"
                  onClick={() => handleViewSubject(subject)}
                >
                  <div className="disciplina-main-content">
                    <div className="disciplina-header-horizontal">
                      <div className="disciplina-info">
                        <div className="disciplina-nome">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              className="disciplina-cor-indicator"
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: cores[subject.color] || cores.azul,
                                flexShrink: 0
                              }}
                            ></div>
                            <span>{subject.name}</span>
                          </div>
                          {statusEstudo !== 'Not Started' && (
                            <span
                              className="status-badge"
                              style={{
                                backgroundColor: `${statusCor}15`,
                                color: statusCor,
                                border: `1px solid ${statusCor}30`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: estaEstudando ? '4px' : '0'
                              }}
                            >
                              {estaEstudando && (
                                <span style={{
                                  width: '6px',
                                  height: '6px',
                                  backgroundColor: '#10B981',
                                  borderRadius: '50%'
                                }}></span>
                              )}
                              {statusEstudo}
                            </span>
                          )}
                        </div>
                        <div className="disciplina-meta">
                          <span className="meta-item">
                            {(() => {
                              if (topicosTotal === 0) {
                                return 'No topics';
                              } else if (topicosTotal === 1) {
                                return '1 topic';
                              } else {
                                return `${topicosTotal} topics`;
                              }
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="disciplina-actions-horizontal">
                    <button
                      className="btn-action-inline btn-editar"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditSubject(subject);
                      }}
                    >
                      Manage Topics
                    </button>
                    <button
                      className="btn-action-inline btn-remover"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSubject(subject);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}

            {(!plan.subjects || plan.subjects.length === 0) && (
              <div className="empty-disciplinas">
                <div className="empty-icon">📚</div>
                <h3 className="empty-title">No subjects added yet</h3>
                <p className="empty-text">
                  Start by adding your first subject to the study plan.
                </p>
                <button
                  onClick={handleNewSubject}
                  className="btn-empty-state"
                >
                  + Add First Subject
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      {showEditModal && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            opacity: isClosing ? 0 : 1,
            visibility: 'visible'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeEditModal();
            }
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: 'var(--darkmode-bg-secondary)',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              transform: isClosing ? 'translateY(30px) scale(0.98)' : 'translateY(0) scale(1)',
              opacity: isClosing ? 0 : 1
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>
              Edit Study
            </h2>

            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: 'var(--darkmode-text-primary)'
                }}>
                  Study Name:
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--darkmode-border-secondary)',
                    borderRadius: '6px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--darkmode-text-link)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--darkmode-border-secondary)'}
                  required
                />
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: 'var(--darkmode-text-primary)'
                }}>
                  Description:
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--darkmode-border-secondary)',
                    borderRadius: '6px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--darkmode-text-link)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--darkmode-border-secondary)'}
                  placeholder="Add a description for the study..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={closeEditModal}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'var(--darkmode-bg-quaternary)',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    color: 'var(--darkmode-text-primary)'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'var(--darkmode-text-link)',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    color: 'var(--darkmode-text-primary)'
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição de Disciplina */}
      {showEditDisciplinaModal && (
        <div
          id="edit-disciplina-modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            opacity: 1,
            visibility: 'visible'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeEditDisciplinaModal();
            }
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--darkmode-bg-secondary)',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              opacity: 1,
              transform: 'scale(1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>
              Edit Subject
            </h2>

            <form onSubmit={handleEditSubjectSubmit}>
              {/* Nome e Cor lado a lado */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '20px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '500',
                    color: 'var(--darkmode-text-primary)'
                  }}>
                    Subject Name:
                  </label>
                  <input
                    type="text"
                    value={subjectFormData.name}
                    onChange={(e) => setSubjectFormData(prev => ({ ...prev, name: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--darkmode-border-secondary)',
                      borderRadius: '6px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--darkmode-text-link)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--darkmode-border-secondary)'}
                    required
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '500',
                    color: 'var(--darkmode-text-primary)'
                  }}>
                    Subject Color:
                  </label>
                  <ColorPicker
                    value={subjectFormData.color}
                    onChange={(color) => setSubjectFormData(prev => ({ ...prev, color }))}
                    colors={CORES_DISCIPLINAS}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: 'var(--darkmode-text-primary)'
                }}>
                  Topics
                </label>

                {/* Lista de tópicos existentes */}
                <div style={{ marginBottom: '15px' }}>
                  {subjectFormData.topics.map((topic, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '8px',
                        padding: '8px',
                        backgroundColor: 'var(--darkmode-bg-tertiary)',
                        borderRadius: '6px',
                        border: '1px solid var(--darkmode-border-secondary)'
                      }}
                    >
                      {editandoTopico === index ? (
                        <input
                          type="text"
                          value={topic}
                          onChange={(e) => {
                            const newText = e.target.value;
                            handleEditTopic(index, newText);
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              setEditandoTopico(null);
                            }
                          }}
                          onBlur={() => setEditandoTopico(null)}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            border: '1px solid var(--darkmode-text-link)',
                            borderRadius: '4px',
                            fontSize: '14px',
                            outline: 'none'
                          }}
                          autoFocus
                        />
                      ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', color: 'var(--darkmode-text-primary)' }}>
                            {index + 1}. {topic}
                          </span>
                          {verificarTopicoAgendado(selectedSubject?._id, topic) && (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              color: 'var(--orange-primary)',
                              backgroundColor: 'rgba(255, 107, 53, 0.1)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid rgba(255, 107, 53, 0.3)'
                            }}>
                              Scheduled
                            </span>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setEditandoTopico(editandoTopico === index ? null : index)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: 'var(--darkmode-text-link)',
                          color: 'var(--darkmode-text-primary)',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        {editandoTopico === index ? 'Save' : 'Edit'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(index)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#EF4444',
                          color: 'var(--darkmode-text-primary)',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {/* Adicionar novo tópico */}
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center'
                }}>
                  <input
                    type="text"
                    value={novoTopico}
                    onChange={(e) => setNovoTopico(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTopic();
                      }
                    }}
                    placeholder="Enter a new topic..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '2px solid var(--darkmode-border-secondary)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--darkmode-text-link)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--darkmode-border-secondary)'}
                  />
                  <button
                    type="button"
                    onClick={handleAddTopic}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#E66912',
                      color: 'var(--darkmode-text-primary)',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={closeEditDisciplinaModal}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'var(--darkmode-bg-quaternary)',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    color: 'var(--darkmode-text-primary)'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'var(--darkmode-text-link)',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    color: 'var(--darkmode-text-primary)'
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Disciplina */}
      {showNovaDisciplinaModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: isClosing ? 'fadeOut 0.25s ease-out' : 'fadeIn 0.25s ease-in'
          }}
          onClick={closeNewSubjectModal}
        >
          <div
            style={{
              backgroundColor: 'var(--darkmode-bg-secondary)',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '90%',
              overflow: 'auto',
              position: 'relative',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              animation: isClosing ? 'slideOut 0.25s ease-out' : 'slideIn 0.25s ease-in'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              margin: '0 0 25px 0',
              fontSize: '24px',
              fontWeight: '600',
              color: 'var(--darkmode-text-primary)',
              borderBottom: '2px solid var(--darkmode-bg-quaternary)',
              paddingBottom: '15px'
            }}>
              New Subject
            </h2>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleSaveNewSubject();
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '20px',
                marginBottom: '25px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '500',
                    color: 'var(--darkmode-text-primary)'
                  }}>
                    Subject Name:
                  </label>
                  <input
                    type="text"
                    value={formDataNovaDisciplina.nome}
                    onChange={(e) => setFormDataNovaDisciplina(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Enter subject name (e.g., Math, Portuguese)"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--darkmode-border-secondary)',
                      borderRadius: '6px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--darkmode-text-link)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--darkmode-border-secondary)'}
                    required
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '500',
                    color: 'var(--darkmode-text-primary)'
                  }}>
                    Subject Color:
                  </label>
                  <ColorPicker
                    value={formDataNovaDisciplina.cor}
                    onChange={(cor) => setFormDataNovaDisciplina(prev => ({ ...prev, cor }))}
                    colors={CORES_DISCIPLINAS}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: 'var(--darkmode-text-primary)'
                }}>
                  Topics
                </label>

                {/* Lista de tópicos existentes */}
                <div style={{ marginBottom: '15px' }}>
                  {formDataNovaDisciplina.topicos.map((topic, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '8px',
                        padding: '8px',
                        backgroundColor: 'var(--darkmode-bg-tertiary)',
                        borderRadius: '6px',
                        border: '1px solid var(--darkmode-border-secondary)'
                      }}
                    >
                      <span style={{ flex: 1, fontSize: '14px', color: 'var(--darkmode-text-primary)' }}>
                        {index + 1}. {topic}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveNewSubjectTopic(index)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#EF4444',
                          color: 'var(--darkmode-text-primary)',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {/* Adicionar novo tópico */}
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <input
                    type="text"
                    value={novoTopico}
                    onChange={(e) => setNovoTopico(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewSubjectTopic();
                      }
                    }}
                    placeholder="Enter a new topic..."
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid var(--darkmode-border-secondary)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: 'var(--darkmode-bg-tertiary)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddNewSubjectTopic}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#E66912',
                      color: 'var(--darkmode-text-primary)',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                paddingTop: '20px',
                borderTop: '1px solid var(--darkmode-border-secondary)'
              }}>
                <button
                  type="button"
                  onClick={closeNewSubjectModal}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'transparent',
                    border: '2px solid var(--darkmode-border-secondary)',
                    borderRadius: '6px',
                    color: 'var(--darkmode-text-secondary)',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#E66912',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'var(--darkmode-text-primary)',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default PlanoDetalhes;
