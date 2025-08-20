import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import Toaster from '../../components/Toaster';
import { useToaster } from '../../hooks/useToaster';
import { SkeletonDisciplina, SkeletonList } from '../../components/Skeleton';

function DisciplinaDetalhes() {
  const { planoId, disciplinaId } = useParams();
  const navigate = useNavigate();
  const { token, authenticatedFetch, forceLogout } = useAuth();
  const { toaster, showError, hideToaster } = useToaster();
  const [loading, setLoading] = useState(true);
  const [disciplina, setDisciplina] = useState(null);
  const [plano, setPlano] = useState(null);
  
  // Estados do modal de registro de estudo
  const [modalAberto, setModalAberto] = useState(false);
  const [topicoSelecionado, setTopicoSelecionado] = useState('');
  const [topicoEditado, setTopicoEditado] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('informacoes');
  
  // SISTEMA DE SESSÃO DE ESTUDO
  // Cada sessão é identificada pelo tópico e armazena todos os dados de estudo
  const [sessaoAtiva, setSessaoAtiva] = useState(null);
  const [sessoesEstudo, setSessoesEstudo] = useState({}); // { [topico]: { sessaoId, dados... } }
  
  // Estado para registrar status dos tópicos (data: hoje, ja-estudei, agendar)
  const [statusTopicos, setStatusTopicos] = useState({});
  
  // Estado para checkbox "Marcar como estudado"
  const [marcarComoEstudado, setMarcarComoEstudado] = useState(false);
  
  // Carregar sessões do localStorage na inicialização
  useEffect(() => {
    if (disciplina?._id) {
      const chaveStorage = `sessoes_estudo_${disciplina._id}`;
      const sessoesStorage = localStorage.getItem(chaveStorage);
      if (sessoesStorage) {
        try {
          const sessoesParsed = JSON.parse(sessoesStorage);
          
          // Converter strings de data de volta para objetos Date
          Object.keys(sessoesParsed).forEach(topicoNome => {
            if (sessoesParsed[topicoNome].timersFinalizados) {
              sessoesParsed[topicoNome].timersFinalizados.forEach(registro => {
                if (registro.horarioFinalizacao && typeof registro.horarioFinalizacao === 'string') {
                  registro.horarioFinalizacao = new Date(registro.horarioFinalizacao);
                }
              });
            }
          });
          
          setSessoesEstudo(sessoesParsed);
        } catch (error) {
          // Silently handle localStorage parsing errors
        }
      }

      // Carregar status dos tópicos
      const chaveStatusStorage = `status_topicos_${disciplina._id}`;
      const statusStorage = localStorage.getItem(chaveStatusStorage);
      if (statusStorage) {
        try {
          const statusParsed = JSON.parse(statusStorage);
          setStatusTopicos(statusParsed);
        } catch (error) {
          // Silently handle localStorage parsing errors
        }
      }
    }
  }, [disciplina?._id]);

  // Função debounced para salvar no localStorage
  const saveToLocalStorage = useCallback((key, data) => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(data));
    }, 500); // Debounce de 500ms
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Salvar sessões no localStorage sempre que mudarem (debounced)
  useEffect(() => {
    if (disciplina?._id && Object.keys(sessoesEstudo).length > 0) {
      const chaveStorage = `sessoes_estudo_${disciplina._id}`;
      const cleanup = saveToLocalStorage(chaveStorage, sessoesEstudo);
      return cleanup;
    }
  }, [sessoesEstudo, disciplina?._id, saveToLocalStorage]);

  // Salvar status dos tópicos no localStorage sempre que mudarem (debounced)
  useEffect(() => {
    if (disciplina?._id && Object.keys(statusTopicos).length > 0) {
      const chaveStatusStorage = `status_topicos_${disciplina._id}`;
      const cleanup = saveToLocalStorage(chaveStatusStorage, statusTopicos);
      return cleanup;
    }
  }, [statusTopicos, disciplina?._id, saveToLocalStorage]);
  
  // Estados compartilhados entre abas
  const [tempoEstudoTimer, setTempoEstudoTimer] = useState(0);
  
  // Estado para controlar finalização forçada dos timers
  const [forcarFinalizacao, setForcarFinalizacao] = useState(false);
  
  // Estado do timer único (simplificado)
  const [timer, setTimer] = useState({ 
    tempo: 0, 
    ativo: false, 
    finalizado: false, 
    nome: '' 
  });
  const [historicoTimers, setHistoricoTimers] = useState([]);
  
  // Estado para timers individuais de cada tópico
  const [timersTopicos, setTimersTopicos] = useState({});
  const topicosUnicos = useMemo(() => Array.from(new Set(disciplina?.topicos || [])), [disciplina?.topicos]);
  
  // Salvar timers no localStorage sempre que mudarem
  useEffect(() => {
    if (disciplina?._id && planoId && Object.keys(timersTopicos).length > 0) {
      const chaveTimersStorage = `timers_${planoId}_${disciplina._id}`;
      localStorage.setItem(chaveTimersStorage, JSON.stringify(timersTopicos));
    }
  }, [timersTopicos, disciplina?._id, planoId]);

  // Carregar timers do localStorage na inicialização
  useEffect(() => {
    if (disciplina?._id && planoId) {
      const chaveTimersStorage = `timers_${planoId}_${disciplina._id}`;
      const timersStorage = localStorage.getItem(chaveTimersStorage);
      if (timersStorage) {
        try {
          const timersCarregados = JSON.parse(timersStorage);
          setTimersTopicos(prev => ({ ...prev, ...timersCarregados }));
        } catch (e) {
          // Silently handle localStorage parsing errors
        }
      }
    }
  }, [disciplina?._id, planoId]);
  
  // Estado para armazenar tempo total da disciplina
  const [tempoTotalDisciplina, setTempoTotalDisciplina] = useState(0);
  
  // Estado para armazenar questões realizadas calculadas
  const [questoesRealizadasTotal, setQuestoesRealizadasTotal] = useState(0);
  
  // Estado para registrar último acesso aos tópicos
  const [ultimosAcessos, setUltimosAcessos] = useState({});
  
  // Estado para armazenar registros de estudo
  const [registrosEstudo, setRegistrosEstudo] = useState([]);
  const [carregandoRegistros, setCarregandoRegistros] = useState(false);
  
  // Estado para armazenar últimos registros por tópico (para performance)
  const [ultimosRegistrosPorTopico, setUltimosRegistrosPorTopico] = useState({});

  // Estados para estatísticas do plano (registros de todas as disciplinas)
  const [registrosPlano, setRegistrosPlano] = useState([]);
  const [ultimosRegistrosPorDisciplina, setUltimosRegistrosPorDisciplina] = useState({});
  const [carregandoRegistrosPlano, setCarregandoRegistrosPlano] = useState(false);

  // Estados para coleta de dados das abas
  const [observacoes, setObservacoes] = useState('');
  const [links, setLinks] = useState([{ titulo: '', url: '' }]);
  const [questoesPlanejadas, setQuestoesPlanejadas] = useState(0);
  const [questoesRealizadas, setQuestoesRealizadas] = useState(0);
  const [material, setMaterial] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [estudoFinalizado, setEstudoFinalizado] = useState(false);

  useEffect(() => {
    fetchDisciplinaDetalhes();
  }, [planoId, disciplinaId]);

  useEffect(() => {
    if (disciplina && disciplina._id) {
      fetchRegistrosEstudo();
      
      // Verificar se deve abrir modal automaticamente
      const urlParams = new URLSearchParams(window.location.search);
      const topicoParaAbrir = urlParams.get('openModal');
      if (topicoParaAbrir) {
        const topicoDecodificado = decodeURIComponent(topicoParaAbrir);
        console.log('🔗 openModal detectado:', topicoDecodificado);
        console.log('📚 Tópicos disponíveis:', disciplina.topicos);
        
        // Verificar se o tópico existe na disciplina
        const topicoExiste = disciplina.topicos?.includes(topicoDecodificado);
        console.log('✅ Tópico existe?', topicoExiste);
        
        if (topicoExiste) {
          console.log('🚀 Abrindo modal para:', topicoDecodificado);
          // Usar setTimeout para garantir que a renderização esteja completa
          setTimeout(() => {
            abrirModalEstudo(topicoDecodificado);
            
            // Limpar parâmetro da URL para evitar reabrir o modal
            const newUrl = window.location.pathname + window.location.search.replace(/[?&]openModal=[^&]*/, '').replace(/^&/, '?');
            window.history.replaceState({}, '', newUrl);
          }, 100);
        } else {
          console.warn('⚠️ Tópico não encontrado na disciplina:', topicoDecodificado);
        }
      }
    }
  }, [disciplina?._id]); // Dependência otimizada

  // Hook para buscar registros do plano apenas quando necessário
  useEffect(() => {
    if (plano && plano._id && abaAtiva === 'estatisticas' && registrosPlano.length === 0) {
      fetchRegistrosPlano();
    }
  }, [plano, abaAtiva]);

  // Hook para sincronizar automaticamente a sessão ativa com mudanças nos estados
  useEffect(() => {
    if (sessaoAtiva && !sessaoAtiva.finalizada && modalAberto && topicoSelecionado) {
      // Sincronizar apenas se o modal estiver aberto e tópico selecionado
      const statusDoTopico = statusTopicos[topicoSelecionado] || { tipo: 'estudando', dataAgendada: '' };
      
      // Atualizar sessão com dados atuais
      const sessaoAtualizada = {
        ...sessaoAtiva,
        tempoEstudo: tempoEstudoTimer,
        material: material,
        comentarios: comentarios,
        links: links,
        questoesPlanejadas: questoesPlanejadas,
        questoesRealizadas: questoesRealizadas,
        estudoFinalizado: estudoFinalizado,
        dataOpcao: statusDoTopico.tipo,
        dataAgendada: statusDoTopico.dataAgendada,
        ultimaAtualizacao: new Date()
      };
      
      setSessaoAtiva(sessaoAtualizada);
      setSessoesEstudo(prev => ({
        ...prev,
        [topicoSelecionado]: sessaoAtualizada
      }));
    }
  }, [questoesPlanejadas, questoesRealizadas, material, comentarios, estudoFinalizado]);

  // Hook para inicializar timers com valores do histórico quando os registros carregarem
  useEffect(() => {
    if (registrosEstudo.length > 0 && disciplina?.topicos) {
      const timersInicializados = {};
      
      disciplina.topicos.forEach(topico => {
        const ultimoTempo = obterUltimoTempoTopico(topico);
        timersInicializados[topico] = {
          tempo: ultimoTempo,
          ativo: false,
          finalizado: false
        };
      });
      
      setTimersTopicos(prev => {
        // Manter timers ativos, apenas atualizar os que estão parados
        const novosTimers = { ...prev };
        Object.entries(timersInicializados).forEach(([topico, dadosTimer]) => {
          if (!prev[topico]?.ativo) {
            novosTimers[topico] = dadosTimer;
          }
        });
        return novosTimers;
      });
    }
  }, [registrosEstudo, disciplina?.topicos]);

  // Hook para calcular tempo total baseado nos timers dos tópicos
  useEffect(() => {
    const tempoTotalTimers = Object.values(timersTopicos).reduce((total, timer) => {
      return total + (timer.tempo || 0);
    }, 0);
    setTempoTotalDisciplina(tempoTotalTimers);
  }, [timersTopicos]);

  const fetchDisciplinaDetalhes = async () => {
    try {
      // Buscar dados do plano para encontrar a disciplina específica
      const response = await authenticatedFetch(`${API_BASE_URL}/api/planos/${planoId}`);

      if (response && response.ok) {
        const planoData = await response.json();
        setPlano(planoData);
        
        // Encontrar a disciplina específica
        const disciplinaEncontrada = planoData.disciplinasDetalhadas?.find(
          d => d._id === disciplinaId
        );
        
        if (disciplinaEncontrada) {
          setDisciplina(disciplinaEncontrada);
          document.title = `${disciplinaEncontrada.nome} - ${planoData.nome} - Radegondes`;
        } else {
          navigate(`/planos/${planoId}`);
        }
      } else if (response === null) {
        // Token inválido, usuário já foi redirecionado para login
        return;
      } else {
        navigate('/planos');
      }
    } catch (error) {
      console.error('Erro ao buscar disciplina:', error);
      navigate('/planos');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrosPlano = useCallback(async () => {
    if (!plano || !plano._id || !token || carregandoRegistrosPlano) return;
    
    setCarregandoRegistrosPlano(true);
    try {
      const timestamp = Date.now();
      const response = await authenticatedFetch(`${API_BASE_URL}/api/registros-estudo?planoId=${plano._id}&limit=5000&_t=${timestamp}`);

      if (response && response.ok) {
        const data = await response.json();
        setRegistrosPlano(data.registros || []);
        
        // Processar para pegar apenas o último registro de cada disciplina
        if (data.registros && Array.isArray(data.registros)) {
          const ultimosPorDisciplina = {};
          
          data.registros.forEach((registro) => {
            const disciplinaId = registro.disciplinaId;
            const dataRegistro = new Date(registro.data || registro.createdAt);
            
            // Se não existe registro para esta disciplina ou este é mais recente
            if (!ultimosPorDisciplina[disciplinaId] || 
                dataRegistro > new Date(ultimosPorDisciplina[disciplinaId].data || ultimosPorDisciplina[disciplinaId].createdAt)) {
              ultimosPorDisciplina[disciplinaId] = registro;
            }
          });
          
          setUltimosRegistrosPorDisciplina(ultimosPorDisciplina);
        }
        
      } else if (response === null) {
        // Token inválido, usuário já foi redirecionado
        return;
      } else {
        console.error('Erro ao buscar registros do plano:', response.status);
      }
    } catch (error) {
      console.error('Erro ao buscar registros do plano:', error);
    } finally {
      setCarregandoRegistrosPlano(false);
    }
  }, [plano, token, authenticatedFetch]);

  const fetchRegistrosEstudo = useCallback(async () => {
    if (!disciplina || !disciplina._id || !token || carregandoRegistros) return;
    
    setCarregandoRegistros(true);
    try {
      const timestamp = Date.now();
      const response = await authenticatedFetch(`${API_BASE_URL}/api/registros-estudo?disciplinaId=${disciplina._id}&limit=1000&_t=${timestamp}`);

      if (response && response.ok) {
        const data = await response.json();
        const registros = data.registros || [];
        
        setRegistrosEstudo(registros);
        
        // Processar últimos registros por tópico - SIMPLIFICADO
        const ultimosPorTopico = {};
        
        registros.forEach((registro) => {
          const topico = registro.topico;
          const dataRegistro = new Date(registro.data || registro.createdAt);
          
          if (!ultimosPorTopico[topico] || 
              dataRegistro > new Date(ultimosPorTopico[topico].data || ultimosPorTopico[topico].createdAt)) {
            ultimosPorTopico[topico] = registro;
          }
        });
        
        setUltimosRegistrosPorTopico(ultimosPorTopico);
        
        // Atualizar status dos tópicos com informação de "já estudado"
        setStatusTopicos(prevStatus => {
          const novoStatus = { ...prevStatus };
          
          // Para cada tópico com registros, verificar se foi estudado
          Object.keys(ultimosPorTopico).forEach(topico => {
            const registro = ultimosPorTopico[topico];
            const foiEstudado = registro.tempoEstudo > 0 || 
                               registro.marcarComoEstudado === true || 
                               registro.questoesRealizadas > 0;
            
            if (foiEstudado) {
              novoStatus[topico] = {
                ...novoStatus[topico],
                jaEstudado: true
              };
            }
          });
          
          return novoStatus;
        });
        
      } else if (response === null) {
        // Token inválido, usuário já foi redirecionado
        return;
      }
    } catch (error) {
      console.error('Erro ao buscar registros:', error);
    } finally {
      setCarregandoRegistros(false);
    }
  }, [disciplina, token, authenticatedFetch]);

  // Função para formatar tempo em segundos para formato legível
  const formatarTempoTotal = (segundos) => {
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

  // Função para formatar data do último acesso
  const formatarUltimoAcesso = (topico) => {
    // Primeiro verificar se há um status salvo para o tópico
    const statusTopico = statusTopicos[topico];
    if (statusTopico && statusTopico.dataEstudo) {
      const dataEstudo = new Date(statusTopico.dataEstudo);
      const agora = new Date();
      const diffMs = agora.getTime() - dataEstudo.getTime();
      const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDias === 0) {
        return 'Hoje';
      } else if (diffDias === 1) {
        return 'Ontem';
      } else if (diffDias < 7) {
        return `${diffDias} dias atrás`;
      } else {
        return dataEstudo.toLocaleDateString('pt-BR');
      }
    }

    // Fallback para ultimosAcessos se não houver status
    const ultimoAcesso = ultimosAcessos[topico];
    if (!ultimoAcesso) {
      return 'Nunca estudado';
    }

    const agora = new Date();
    const diffMs = agora.getTime() - ultimoAcesso.getTime();
    const diffSegundos = Math.floor(diffMs / 1000);
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffSegundos < 30) {
      return 'Agora mesmo';
    } else if (diffMinutos < 1) {
      return `${diffSegundos}s atrás`;
    } else if (diffMinutos < 60) {
      return `${diffMinutos}min atrás`;
    } else if (diffHoras < 24) {
      const minutosExtras = diffMinutos % 60;
      return minutosExtras > 0 ? `${diffHoras}h ${minutosExtras}min atrás` : `${diffHoras}h atrás`;
    } else if (diffDias === 1) {
      return 'Ontem';
    } else if (diffDias < 7) {
      return `${diffDias} dias atrás`;
    } else {
      return ultimoAcesso.toLocaleDateString('pt-BR');
    }
  };

  // Função para verificar se um tópico foi finalizado
  const verificarTopicoFinalizado = (topico) => {
    // Verificar se o array de registros existe e não está vazio
    if (!Array.isArray(registrosEstudo) || registrosEstudo.length === 0) {
      return false;
    }

    const registrosDoTopico = registrosEstudo.filter(r => r && r.topico === topico);
    if (registrosDoTopico.length === 0) return false;
    
    // Pegar o registro mais recente do tópico
    const ultimoRegistro = registrosDoTopico.sort((a, b) => {
      const dataA = new Date(a.data || a.createdAt || 0).getTime();
      const dataB = new Date(b.data || b.createdAt || 0).getTime();
      return dataB - dataA;
    })[0];
    
    return ultimoRegistro?.estudoFinalizado || false;
  };

  // Função para formatar status do tópico
  const formatarStatusTopico = (topico) => {
    const status = statusTopicos[topico];
    if (!status) {
      return 'Não estudado';
    }
    const finalizadoText = status.estudoFinalizado ? ' ✓' : '';
    switch (status.tipo) {
      case 'hoje':
        return `Estudado hoje${finalizadoText}`;
      case 'estudando':
        return `Estudando${finalizadoText}`;
      case 'ja-estudei':
        return `Já estudado${finalizadoText}`;
      case 'agendar':
        const dataFormatada = status.dataAgendada ? 
          new Date(status.dataAgendada).toLocaleDateString('pt-BR') : 
          'Data não definida';
        return `Agendado: ${dataFormatada}`;
      default:
        return 'Não estudado';
    }
  };

  // Função auxiliar para verificar se um tópico está agendado
  const verificarTopicoAgendado = (topico) => {
    const status = statusTopicos[topico];
    return status && status.tipo === 'agendar' && status.dataAgendada;
  };

  // Função para formatar data relativa com horário
  const formatarDataRelativaComHorario = (dataAgendada) => {
    if (!dataAgendada) return '';
    
    const agora = new Date();
    const dataAgendamento = new Date(dataAgendada);
    
    // Calcular diferença em dias
    const diffTime = dataAgendamento.getTime() - agora.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Formatar horário
    const horario = dataAgendamento.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    // Determinar texto relativo
    let textoRelativo = '';
    if (diffDays === 0) {
      textoRelativo = 'Hoje';
    } else if (diffDays === 1) {
      textoRelativo = 'Amanhã';
    } else if (diffDays === -1) {
      textoRelativo = 'Ontem';
    } else if (diffDays > 1) {
      textoRelativo = `Em ${diffDays} dias`;
    } else if (diffDays < -1) {
      textoRelativo = `${Math.abs(diffDays)} dias atrás`;
    }
    
    return `${textoRelativo} às ${horario}`;
  };

  // Função para obter o último tempo registrado de um tópico específico
  const obterUltimoTempoTopico = (topico) => {
    if (!Array.isArray(registrosEstudo) || registrosEstudo.length === 0) {
      return 0;
    }
    
    // Filtrar registros do tópico específico
    const registrosDoTopico = registrosEstudo.filter(registro => {
      if (!registro) return false;
      return registro.topico === topico;
    });
    
    if (registrosDoTopico.length === 0) {
      return 0;
    }
    
    // Pegar o registro mais recente
    const ultimoRegistro = registrosDoTopico.sort((a, b) => {
      const dataA = new Date(a?.data || a?.createdAt || 0).getTime();
      const dataB = new Date(b?.data || b?.createdAt || 0).getTime();
      return dataB - dataA;
    })[0];
    
    // Retornar o tempo do último registro
    return ultimoRegistro?.tempoEstudo || 0;
  };

  // Função para carregar o último registro de um tópico e preencher os campos
  const carregarUltimoRegistro = (topico) => {
    // SIMPLIFICADO: Usar sempre ultimosRegistrosPorTopico como fonte única da verdade
    const ultimoRegistro = ultimosRegistrosPorTopico[topico];
    
    if (ultimoRegistro) {
      // Converter para números garantindo que não seja NaN
      const questoesPlanejadas = parseInt(ultimoRegistro.questoesPlanejadas) || 0;
      const questoesRealizadas = parseInt(ultimoRegistro.questoesRealizadas) || 0;
      const material = ultimoRegistro.material || '';
      const observacoes = ultimoRegistro.observacoes || '';
      
      // Definir estados diretamente
      setQuestoesPlanejadas(questoesPlanejadas);
      setQuestoesRealizadas(questoesRealizadas);
      setMaterial(material);
      setComentarios(observacoes);
      setEstudoFinalizado(ultimoRegistro.estudoFinalizado || false);
      
      // Links
      if (ultimoRegistro.links && Array.isArray(ultimoRegistro.links) && ultimoRegistro.links.length > 0) {
        setLinks(ultimoRegistro.links);
      } else {
        setLinks([{ titulo: '', url: '' }]);
      }
      
      console.log(`Modal carregado - ${topico}:`, {
        questoesPlanejadas,
        questoesRealizadas,
        fonte: 'ultimosRegistrosPorTopico'
      });
      
    } else {
      // Limpar se não há registro
      setQuestoesPlanejadas(0);
      setQuestoesRealizadas(0);
      setMaterial('');
      setComentarios('');
      setEstudoFinalizado(false);
      setLinks([{ titulo: '', url: '' }]);
      
      console.log(`Modal limpo - ${topico}: Nenhum registro encontrado`);
    }
  };

  const abrirModalEstudo = (topico, abaInicial = 'informacoes') => {
    console.log(`=== ABRINDO MODAL - ${topico} ===`);
    
    // Definir estados básicos
    setTopicoSelecionado(topico);
    setTopicoEditado(topico);
    setAbaAtiva(abaInicial);
    
    // Verificar se o tópico já foi estudado e marcar o checkbox
    const jaFoiEstudado = statusTopicos[topico]?.jaEstudado || false;
    setMarcarComoEstudado(jaFoiEstudado);
    
    // Sincronizar timer
    const timerAtual = timersTopicos[topico];
    if (timerAtual) {
      setTempoEstudoTimer(timerAtual.tempo);
    }
    
    // SIMPLIFICADO: Sempre carregar dados do ultimosRegistrosPorTopico
    carregarUltimoRegistro(topico);
    
    // Criar sessão básica
    setSessaoAtiva({
      sessaoId: gerarSessaoIdUnica('session', topico),
      topico: topico,
      iniciadaEm: new Date(),
      finalizada: false
    });
    
    // Registrar acesso
    setUltimosAcessos(prev => ({
      ...prev,
      [topico]: new Date()
    }));
    
    setModalAberto(true);
  };

  // SISTEMA DE GERENCIAMENTO DE SESSÕES DE ESTUDO
  
  // Função para criar um ID único para a sessão
  const criarSessaoId = (topico) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${topico}_${timestamp}_${random}`;
  };

  // Função para carregar dados de uma sessão existente nos estados do modal
  const carregarDadosSessao = (sessao) => {
    setTempoEstudoTimer(sessao.tempoEstudo || 0);
    setMaterial(sessao.material || '');
    setComentarios(sessao.comentarios || '');
    setLinks(sessao.links || [{ titulo: '', url: '' }]);
    setQuestoesPlanejadas(sessao.questoesPlanejadas || 0);
    setQuestoesRealizadas(sessao.questoesRealizadas || 0);
    setEstudoFinalizado(sessao.estudoFinalizado || false);
    
    // Carregar dados de data se existirem
    if (sessao.dataOpcao && sessao.topico) {
      setStatusTopicos(prev => ({
        ...prev,
        [sessao.topico]: {
          tipo: sessao.dataOpcao,
          dataAgendada: sessao.dataAgendada || ''
        }
      }));
    }
    
    // Carregar estado do timer se existir
    if (sessao.timers && typeof sessao.timers === 'object') {
      setTimer(sessao.timers);
    } else {
      setTimer({ tempo: 0, ativo: false, finalizado: false, nome: '' });
    }
    
    // Carregar histórico de timers se existir
    if (sessao.historicoTimers && Array.isArray(sessao.historicoTimers)) {
      setHistoricoTimers(sessao.historicoTimers);
    } else {
      setHistoricoTimers([]);
    }
  };

  // Função para sincronizar estados do modal com a sessão ativa
  const sincronizarSessao = () => {
    if (!sessaoAtiva) return;
    
    const statusDoTopico = statusTopicos[sessaoAtiva.topico] || { tipo: 'estudando', dataAgendada: '' };
    
    // Obter tempo atual do timer do tópico
    const timerAtual = timersTopicos[sessaoAtiva.topico];
    const tempoAtual = timerAtual ? timerAtual.tempo : tempoEstudoTimer;
    
    const sessaoAtualizada = {
      ...sessaoAtiva,
      tempoEstudo: tempoAtual,
      material: material,
      comentarios: comentarios,
      links: links,
      questoesPlanejadas: questoesPlanejadas,
      questoesRealizadas: questoesRealizadas,
      estudoFinalizado: estudoFinalizado,
      timers: timer,
      historicoTimers: historicoTimers,
      dataOpcao: statusDoTopico.tipo,
      dataAgendada: statusDoTopico.dataAgendada,
      ultimaAtualizacao: new Date()
    };
    
    // Debug log para verificar se as questões estão sendo sincronizadas
    console.log('Sincronizando sessão:', {
      topico: sessaoAtiva.topico,
      questoesPlanejadas,
      questoesRealizadas,
      sessaoAtualizada
    });
    
    setSessaoAtiva(sessaoAtualizada);
    setSessoesEstudo(prev => ({
      ...prev,
      [sessaoAtiva.topico]: sessaoAtualizada
    }));
  };

  // Função para finalizar uma sessão de estudo
  const finalizarSessaoEstudo = async () => {
    if (!sessaoAtiva) {
      return;
    }
    
    // Sincronizar dados antes de finalizar
    sincronizarSessao();
    
    // Obter tempo atual do timer do tópico
    const timerAtual = timersTopicos[sessaoAtiva.topico];
    const tempoAtual = timerAtual ? timerAtual.tempo : tempoEstudoTimer;
    
    // Marcar sessão como finalizada
    const sessaoFinalizada = {
      ...sessaoAtiva,
      finalizada: true,
      finalizadaEm: new Date(),
      tempoEstudo: tempoAtual,
      material: material,
      comentarios: comentarios,
      links: links,
      questoesPlanejadas: questoesPlanejadas,
      questoesRealizadas: questoesRealizadas,
      estudoFinalizado: estudoFinalizado
    };
    
    // Debug log para verificar dados finalizados
    console.log('Finalizando sessão:', {
      topico: sessaoAtiva.topico,
      questoesPlanejadas,
      questoesRealizadas,
      sessaoFinalizada
    });
    
    // Atualizar estados
    setSessoesEstudo(prev => ({
      ...prev,
      [sessaoAtiva.topico]: sessaoFinalizada
    }));
    
    return sessaoFinalizada;
  };

  // Função para resetar estados do modal
  const resetarEstadosModal = () => {
    // Só resetar se não há sessão ativa
    setTempoEstudoTimer(0);
    setMaterial('');
    setComentarios('');
    setLinks([{ titulo: '', url: '' }]);
    setQuestoesPlanejadas(0);
    setQuestoesRealizadas(0);
    setEstudoFinalizado(false);
    setObservacoes('');
    setTopicoEditado('');
    setTimer({ tempo: 0, ativo: false, finalizado: false, nome: '' });
    setHistoricoTimers([]);
  };

  const fecharModal = () => {
    // SIMPLIFICADO: Apenas resetar estados e fechar
    setModalAberto(false);
    setTopicoSelecionado('');
    setAbaAtiva('informacoes');
    setSessaoAtiva(null);
    
    // Resetar campos do modal
    setQuestoesPlanejadas(0);
    setQuestoesRealizadas(0);
    setMaterial('');
    setComentarios('');
    setEstudoFinalizado(false);
    setMarcarComoEstudado(false);
    setLinks([{ titulo: '', url: '' }]);
    setTempoEstudoTimer(0);
  };

  const salvarRegistro = async () => {
    if (!disciplina?._id || !token || !topicoSelecionado) {
      alert('Dados incompletos para salvamento!');
      return;
    }

    try {
      // Dados diretos dos estados atuais
      const dadosParaSalvar = {
        sessaoId: gerarSessaoIdUnica('manual', topicoSelecionado),
        disciplinaId: disciplina._id,
        disciplinaNome: disciplina.nome,
        planoId: planoId,
        topico: topicoSelecionado,
        tempoEstudo: tempoEstudoTimer || 0,
        observacoes: comentarios?.trim() || '',
        material: material?.trim() || '',
        links: Array.isArray(links) ? links.filter(link => link.titulo?.trim() || link.url?.trim()) : [],
        questoesPlanejadas: parseInt(questoesPlanejadas) || 0,
        questoesRealizadas: parseInt(questoesRealizadas) || 0,
        estudoFinalizado: Boolean(estudoFinalizado),
        marcarComoEstudado: Boolean(marcarComoEstudado),
        dataOpcao: statusTopicos[topicoSelecionado]?.tipo || 'estudando',
        dataAgendada: statusTopicos[topicoSelecionado]?.dataAgendada || '',
        tipoAtividade: 'estudo',
        iniciadaEm: new Date(),
        finalizadaEm: new Date()
      };
      
      console.log('Salvando:', dadosParaSalvar);

      const response = await authenticatedFetch(`${API_BASE_URL}/api/registro-estudo`, {
        method: 'POST',
        body: JSON.stringify(dadosParaSalvar),
      });

      if (response && response.ok) {
        // Atualizar status do tópico baseado na sessão atual
        setStatusTopicos(prev => ({
          ...prev,
          [topicoSelecionado]: {
            ...prev[topicoSelecionado],
            jaEstudado: marcarComoEstudado,
            tipo: prev[topicoSelecionado]?.tipo || 'estudando'
          }
        }));
        
        // Recarregar dados
        await fetchRegistrosEstudo();
        
        alert('Registro salvo com sucesso!');
        fecharModal();
      } else if (response === null) {
        // Token inválido, usuário já foi redirecionado
        return;
      } else {
        const errorText = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }

    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert(`Erro: ${error.message}`);
    }
  };

  // Função para gerar ID único de sessão
  const gerarSessaoIdUnica = (tipo, topico) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const userId = token ? btoa(token).substring(0, 6) : 'anon';
    return `${tipo}_${topico.replace(/\s+/g, '_')}_${timestamp}_${random}_${userId}`;
  };

  // Função para salvamento automático quando pausar timer
  const salvarAutomatico = async (topico) => {
    try {
      if (!disciplina || !disciplina._id || !token) {
        return;
      }

      // Obter dados atuais do timer
      const timerAtual = timersTopicos[topico];
      if (!timerAtual || timerAtual.tempo === 0) {
        return; // Não salvar se não há tempo registrado
      }

      // Criar dados básicos para salvamento automático
      const dadosCompletos = {
        sessaoId: gerarSessaoIdUnica('auto', topico),
        disciplinaId: disciplina._id,
        disciplinaNome: disciplina.nome,
        planoId: planoId,
        topico: topico,
        tempoEstudo: timerAtual.tempo,
        observacoes: '',
        material: '',
        links: [],
        questoesPlanejadas: 0,
        questoesRealizadas: 0,
        estudoFinalizado: false,
        dataOpcao: 'hoje',
        dataAgendada: '',
        tipoAtividade: 'estudo',
        iniciadaEm: new Date(),
        finalizadaEm: new Date()
      };

      const response = await authenticatedFetch(`${API_BASE_URL}/api/registro-estudo`, {
        method: 'POST',
        body: JSON.stringify(dadosCompletos),
      });

      if (response && response.ok) {
        // Recarregar registros silenciosamente
        await fetchRegistrosEstudo();
      } else if (response === null) {
        // Token inválido, usuário já foi redirecionado
        return;
      }

    } catch (error) {
      // Falha silenciosa para não interromper UX
      console.error('Erro no salvamento automático:', error);
    }
  };

  // Função para remover um tópico
  const removerTopico = async (topicoNome) => {
    try {
      if (!disciplina || !disciplina._id) {
        alert('Erro: Disciplina não encontrada!');
        return;
      }

      if (!token) {
        alert('Erro: Token de autenticação não encontrado!');
        return;
      }

      // Remover tópico da lista
      const novosTopicos = disciplina.topicos.filter(topico => topico !== topicoNome);
      
      // Atualizar disciplina no backend
      const response = await fetch(`${API_BASE_URL}/api/planos/${planoId}/disciplinas/${disciplina._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...disciplina,
          topicos: novosTopicos,
          topicosTotal: novosTopicos.length
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}`);
      }

      // Atualizar estado local
      setDisciplina(prev => ({
        ...prev,
        topicos: novosTopicos,
        topicosTotal: novosTopicos.length
      }));

      // Remover timer do tópico se existir
      setTimersTopicos(prev => {
        const novosTimers = { ...prev };
        delete novosTimers[topicoNome];
        return novosTimers;
      });

      alert(`Tópico "${topicoNome}" removido com sucesso!`);
      
    } catch (error) {
      console.error('Erro ao remover tópico:', error);
      alert('Erro ao remover tópico. Tente novamente.');
    }
  };

  if (loading) {
    return <SkeletonDisciplina />;
  }

  if (!disciplina) {
    return (
      <div className="error-container">
        Disciplina não encontrada
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Toaster
        show={toaster.show}
        message={toaster.message}
        type={toaster.type}
        onClose={hideToaster}
      />

      <style>
        {`
          input[type="date"]::-webkit-calendar-picker-indicator {
            display: none;
            -webkit-appearance: none;
          }
          input[type="date"]::-webkit-inner-spin-button {
            display: none;
            -webkit-appearance: none;
          }
          input[type="date"]::-webkit-outer-spin-button {
            display: none;
            -webkit-appearance: none;
          }
          input[type="date"]::-moz-calendar-picker-indicator {
            display: none;
          }
          input[type="time"]::-webkit-calendar-picker-indicator {
            display: none;
            -webkit-appearance: none;
          }
          input[type="time"]::-webkit-inner-spin-button {
            display: none;
            -webkit-appearance: none;
          }
          input[type="time"]::-webkit-outer-spin-button {
            display: none;
            -webkit-appearance: none;
          }
          input[type="time"]::-moz-calendar-picker-indicator {
            display: none;
          }
        `}
      </style>
      <div className="page-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="page-subtitle">
            {plano?.nome}
          </div>
          <h1 className="page-title">
            {disciplina.nome}
          </h1>
        </div>
        <button
          onClick={() => {
            // Fechar modal se estiver aberto
            if (modalAberto) {
              setModalAberto(false);
            }
            // Navegar para a lista de planos
            navigate(`/planos/${planoId}`);
          }}
          className="back-to-list-button"
          style={{
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '8px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Voltar à lista de disciplinas
        </button>
      </div>

      {/* Conteúdo da disciplina */}
      <div className="main-card">
        <div className="stats-grid">
          <div className="stat-card" style={{ opacity: '0.7' }}>
            <div className="stat-label" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              justifyContent: 'center'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 6H21M8 12H21M8 18H21M3 6.5H4V5.5H3V6.5ZM3 12.5H4V11.5H3V12.5ZM3 18.5H4V17.5H3V18.5Z" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Total de Tópicos
            </div>
            <div className="stat-value" style={{ textAlign: 'center' }}>
              {disciplina.topicosTotal}
            </div>
          </div>

          <div className="stat-card" style={{ opacity: '0.7' }}>
            <div className="stat-label" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              justifyContent: 'center'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Tempo de Estudo
            </div>
            <div className="stat-value-purple" style={{ textAlign: 'center' }}>
              {formatarTempoTotal(tempoTotalDisciplina)}
            </div>
          </div>
          
          <div className="stat-card" style={{ opacity: '0.7' }}>
            <div className="stat-label" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              justifyContent: 'center'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Tópicos Estudados
            </div>
            <div className="stat-value-success" style={{ textAlign: 'center' }}>
              0
            </div>
          </div>
          
          <div className="stat-card" style={{ opacity: '0.7' }}>
            <div className="stat-label" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              justifyContent: 'center'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Questões Corretas
            </div>
            <div className="stat-value-success" style={{ textAlign: 'center' }}>
              {(() => {
                // Somar questões realizadas (corretas) dos tópicos visíveis na lista
                if (topicosUnicos.length === 0 || !ultimosRegistrosPorTopico) {
                  return 0;
                }
                return topicosUnicos.reduce((total, topico) => {
                  const registro = ultimosRegistrosPorTopico[topico];
                  if (registro) {
                    return total + (Number(registro.questoesRealizadas) || 0);
                  }
                  return total;
                }, 0);
              })()}
            </div>
          </div>
          
          <div className="stat-card" style={{ opacity: '0.7' }}>
            <div className="stat-label" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              justifyContent: 'center'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 14L12 12M12 12L14 10M12 12L10 10M12 12L14 14M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Questões Erradas
            </div>
            <div className="stat-value" style={{ color: '#EF4444', fontSize: '24px', fontWeight: '700', textAlign: 'center' }}>
              {(() => {
                // Calcular questões erradas dos tópicos visíveis na lista
                if (topicosUnicos.length === 0 || !ultimosRegistrosPorTopico) {
                  return 0;
                }
                return topicosUnicos.reduce((total, topico) => {
                  const registro = ultimosRegistrosPorTopico[topico];
                  if (registro) {
                    const planejadas = Number(registro.questoesPlanejadas) || 0;
                    const realizadas = Number(registro.questoesRealizadas) || 0;
                    if (planejadas === 0) return total;
                    const erradas = Math.max(0, planejadas - realizadas);
                    return total + erradas;
                  }
                  return total;
                }, 0);
              })()}
            </div>
          </div>
        </div>

        {/* Lista de Tópicos */}
        <div style={{
          marginBottom: '30px'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--darkmode-text-primary)',
            margin: '0 0 20px 0',
            borderBottom: '2px solid var(--darkmode-bg-quaternary)',
            paddingBottom: '10px'
          }}>
            Tópicos da Disciplina
          </h3>
          
          {topicosUnicos && topicosUnicos.length > 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* Header da lista */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px 180px 150px',
                gap: '20px',
                padding: '12px 16px',
                backgroundColor: 'var(--darkmode-bg-tertiary)',
                borderRadius: '8px',
                border: '1px solid var(--darkmode-border-secondary)',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--darkmode-text-secondary)'
              }}>
                <div>Nome do Tópico</div>
                <div style={{ textAlign: 'center' }}>Timer</div>
                <div style={{ textAlign: 'center' }}>Questões</div>
                <div style={{ textAlign: 'center' }}>Ações</div>
              </div>
              
              {/* Lista de tópicos */}
              {topicosUnicos.map((topico) => (
                <div
                  key={topico}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 120px 180px 150px',
                    gap: '20px',
                    padding: '16px',
                    backgroundColor: 'var(--darkmode-bg-secondary)',
                    borderRadius: '8px',
                    border: '1px solid var(--darkmode-border-secondary)',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--darkmode-bg-tertiary)';
                    e.currentTarget.style.borderColor = 'var(--darkmode-border-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--darkmode-bg-secondary)';
                    e.currentTarget.style.borderColor = 'var(--darkmode-border-secondary)';
                  }}
                >
                  {/* Nome do Tópico */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      abrirModalEstudo(topico);
                    }}
                    style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    color: 'var(--darkmode-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    flex: 1,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--darkmode-bg-tertiary)';
                    e.currentTarget.style.color = 'var(--orange-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--darkmode-text-primary)';
                  }}
                  title="Clique para abrir modal de estudo"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <span>{topico}</span>
                      {statusTopicos[topico]?.jaEstudado && (
                        <span style={{
                          padding: '2px 6px',
                          backgroundColor: 'rgba(34, 197, 94, 0.1)',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          borderRadius: '4px',
                          color: 'var(--green-primary, #22c55e)',
                          fontWeight: '500',
                          fontSize: '12px'
                        }}>
                          Já estudei
                        </span>
                      )}
                      {verificarTopicoAgendado(topico) && (
                        <>
                          <span style={{
                            padding: '2px 6px',
                            backgroundColor: 'rgba(255, 107, 53, 0.1)',
                            border: '1px solid rgba(255, 107, 53, 0.3)',
                            borderRadius: '4px',
                            color: 'var(--orange-primary)',
                            fontWeight: '500',
                            fontSize: '12px'
                          }}>
                            Revisão Agendada
                          </span>
                          <span style={{
                            fontSize: '12px',
                            color: 'var(--darkmode-text-secondary)',
                            fontWeight: '400',
                            whiteSpace: 'nowrap'
                          }}>
                            {formatarDataRelativaComHorario(
                              statusTopicos[topico]?.dataAgendada && statusTopicos[topico]?.horarioAgendado
                                ? new Date(`${statusTopicos[topico].dataAgendada}T${statusTopicos[topico].horarioAgendado}`)
                                : null
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Timer do Tópico */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <TimerTopico 
                      topico={topico}
                      timersTopicos={timersTopicos}
                      setTimersTopicos={setTimersTopicos}
                      onPause={salvarAutomatico}
                      obterUltimoTempoTopico={obterUltimoTempoTopico}
                      token={token}
                      disciplina={disciplina}
                      planoId={planoId}
                    />
                  </div>

                  {/* Questões Corretas e Erradas */}
                  {(() => {
                    // USAR MESMA LÓGICA DO MODAL
                    const ultimoRegistro = ultimosRegistrosPorTopico[topico];
                    const questoesPlanejadas = ultimoRegistro ? (parseInt(ultimoRegistro.questoesPlanejadas) || 0) : 0;
                    const questoesRealizadas = ultimoRegistro ? (parseInt(ultimoRegistro.questoesRealizadas) || 0) : 0;
                    const questoesErradas = Math.max(0, questoesPlanejadas - questoesRealizadas);

                    return (
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {/* Questões Corretas */}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirModalEstudo(topico, 'detalhes');
                          }}
                          style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 10px',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: '#10B981',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                        }}
                        title="Clique para editar questões"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {questoesRealizadas}
                        </div>
                        
                        {/* Questões Erradas */}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirModalEstudo(topico, 'detalhes');
                          }}
                          style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 10px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: '#EF4444',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                        }}
                        title="Clique para editar questões"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 14L12 12M12 12L14 10M12 12L10 10M12 12L14 14M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {questoesErradas}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Botões de Ação */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirModalEstudo(topico);
                      }}
                      className="topic-action-button success"
                    >
                      Abrir
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const confirmRemove = window.confirm(`Tem certeza que deseja remover o tópico "${topico}"?`);
                        if (confirmRemove) {
                          removerTopico(topico);
                        }
                      }}
                      className="topic-action-button danger"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              backgroundColor: 'var(--darkmode-bg-tertiary)',
              borderRadius: '8px',
              border: '1px solid var(--darkmode-border-secondary)',
              opacity: '0.7'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '16px'
              }}>
                📚
              </div>
              <h4 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: 'var(--darkmode-text-primary)',
                margin: '0 0 8px 0'
              }}>
                Nenhum tópico encontrado
              </h4>
              <p style={{
                fontSize: '14px',
                color: 'var(--darkmode-text-secondary)',
                margin: 0
              }}>
                Esta disciplina ainda não possui tópicos cadastrados.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Registro de Estudo */}
      {modalAberto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--darkmode-bg-secondary)',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Cabeçalho do Modal */}
            <div style={{
              marginBottom: '25px',
              paddingBottom: '15px',
              borderBottom: '2px solid var(--darkmode-bg-quaternary)'
            }}>
              <div>
                <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--darkmode-text-primary)',
                margin: '0 0 5px 0'
              }}>
                Estudo {plano?.nome || ''}
              </h2>
                {sessaoAtiva && (
                  <div style={{
                    fontSize: '14px',
                    color: 'var(--darkmode-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: sessaoAtiva.finalizada ? 'var(--darkmode-button-danger)' : 'var(--darkmode-button-success)',
                      borderRadius: '50%'
                    }}></span>
                    <span>
                      {sessaoAtiva.finalizada ? 'Sessão Finalizada' : 'Sessão Ativa'}: {disciplina?.nome} - {sessaoAtiva.topico}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Abas do Modal */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid var(--darkmode-border-secondary)',
              marginBottom: '25px'
            }}>
              {[
                { id: 'informacoes', label: 'Informações' },
                { id: 'timers', label: 'Timers' },
                { id: 'links', label: 'Links' },
                { id: 'detalhes', label: 'Questões' }
              ].map((aba) => (
                <button
                  key={aba.id}
                  onClick={() => setAbaAtiva(aba.id)}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: abaAtiva === aba.id ? 'var(--darkmode-bg-tertiary)' : 'transparent',
                    border: 'none',
                    color: abaAtiva === aba.id ? 'var(--orange-primary)' : 'var(--darkmode-text-secondary)',
                    fontWeight: abaAtiva === aba.id ? '600' : '500',
                    cursor: 'pointer',
                    fontSize: '14px',
                    borderRadius: '6px'
                  }}
                >
                  {aba.label}
                </button>
              ))}
            </div>

            {/* Conteúdo das Abas */}
            <div style={{ minHeight: '300px' }}>
              {abaAtiva === 'informacoes' && <AbaInformacoes 
                disciplina={disciplina} 
                topico={topicoSelecionado} 
                tempoEstudoTimer={tempoEstudoTimer} 
                setAbaAtiva={setAbaAtiva} 
                statusTopicos={statusTopicos}
                setStatusTopicos={setStatusTopicos}
                material={material}
                setMaterial={setMaterial}
                comentarios={comentarios}
                setComentarios={setComentarios}
                estudoFinalizado={estudoFinalizado}
                setEstudoFinalizado={setEstudoFinalizado}
                topicoEditado={topicoEditado}
                setTopicoEditado={setTopicoEditado}
              />}
              {abaAtiva === 'timers' && <AbaTimers 
                topico={topicoSelecionado}
                timersTopicos={timersTopicos}
                setTimersTopicos={setTimersTopicos}
                setTempoEstudoTimer={setTempoEstudoTimer}
                onPause={salvarAutomatico}
                obterUltimoTempoTopico={obterUltimoTempoTopico}
              />}
              {abaAtiva === 'links' && <AbaLinks 
                links={links} 
                setLinks={setLinks}
              />}
              {abaAtiva === 'detalhes' && <AbaDetalhes 
                questoesPlanejadas={questoesPlanejadas}
                setQuestoesPlanejadas={setQuestoesPlanejadas}
                questoesRealizadas={questoesRealizadas}
                setQuestoesRealizadas={setQuestoesRealizadas}
              />}
            </div>

            {/* Rodapé do Modal */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              marginTop: '25px',
              paddingTop: '20px',
              borderTop: '1px solid var(--darkmode-border-secondary)'
            }}>
              {/* Checkbox "Marcar como estudado" no lado esquerdo */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: 'var(--darkmode-text-primary)',
                  userSelect: 'none'
                }}>
                  <div style={{
                    position: 'relative',
                    width: '18px',
                    height: '18px'
                  }}>
                    <input
                      type="checkbox"
                      checked={marcarComoEstudado}
                      onChange={(e) => {
                        setMarcarComoEstudado(e.target.checked);
                        
                        // Efeito de ripple
                        if (e.target.checked) {
                          const ripple = document.createElement('div');
                          ripple.style.cssText = `
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            width: 4px;
                            height: 4px;
                            background: rgba(245, 158, 11, 0.6);
                            border-radius: 50%;
                            transform: translate(-50%, -50%);
                            animation: ripple 0.6s ease-out;
                            pointer-events: none;
                            z-index: 1;
                          `;
                          e.target.parentElement.appendChild(ripple);
                          setTimeout(() => ripple.remove(), 600);
                        }
                      }}
                      style={{
                        position: 'absolute',
                        opacity: 0,
                        width: '100%',
                        height: '100%',
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid var(--orange)',
                      borderRadius: '4px',
                      backgroundColor: marcarComoEstudado ? 'var(--orange)' : 'transparent',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: marcarComoEstudado ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: marcarComoEstudado ? '0 0 0 2px rgba(245, 158, 11, 0.2)' : 'none'
                    }}>
                      {marcarComoEstudado && (
                        <svg 
                          width="12" 
                          height="12" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                          style={{
                            animation: 'checkmarkBounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            strokeDasharray: '24',
                            strokeDashoffset: '24',
                            animationFillMode: 'forwards'
                          }}
                        >
                          <path 
                            d="M20 6L9 17L4 12" 
                            stroke="white" 
                            strokeWidth="3" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            style={{
                              animation: 'checkmarkDraw 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s forwards',
                              strokeDasharray: '24',
                              strokeDashoffset: '24'
                            }}
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  Marcar como estudado
                </label>
              </div>

              {/* Botões do lado direito */}
              <div style={{
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  onClick={fecharModal}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'var(--darkmode-text-secondary)',
                    color: 'var(--darkmode-bg-secondary)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarRegistro}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'var(--darkmode-button-success)',
                    color: 'var(--darkmode-bg-secondary)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Salvar Registro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* CSS para animações do checkmark */}
      <style>
        {`
          @keyframes checkmarkBounce {
            0% {
              transform: scale(0) rotate(45deg);
              opacity: 0;
            }
            50% {
              transform: scale(1.3) rotate(45deg);
              opacity: 1;
            }
            70% {
              transform: scale(0.9) rotate(45deg);
              opacity: 1;
            }
            100% {
              transform: scale(1) rotate(0deg);
              opacity: 1;
            }
          }

          @keyframes checkmarkDraw {
            0% {
              stroke-dashoffset: 24;
            }
            100% {
              stroke-dashoffset: 0;
            }
          }

          /* Efeito hover no label do checkbox */
          label:has(input[type="checkbox"]):hover > div > div {
            transform: scale(1.05);
            border-color: rgba(245, 158, 11, 0.8);
          }

          /* Efeito de ripple quando clicado */
          @keyframes ripple {
            0% {
              transform: scale(0);
              opacity: 1;
            }
            100% {
              transform: scale(4);
              opacity: 0;
            }
          }

          /* Animação do background do checkbox */
          input[type="checkbox"]:checked + div {
            animation: backgroundFill 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          @keyframes backgroundFill {
            0% {
              background-color: transparent;
              transform: scale(1);
            }
            50% {
              background-color: var(--orange);
              transform: scale(1.1);
            }
            100% {
              background-color: var(--orange);
              transform: scale(1.05);
            }
          }
        `}
      </style>
    </div>
  );
}

// Componente da Aba Informações
function AbaInformacoes({ disciplina, topico, tempoEstudoTimer, setAbaAtiva, statusTopicos, setStatusTopicos, material, setMaterial, comentarios, setComentarios, estudoFinalizado, setEstudoFinalizado, topicoEditado, setTopicoEditado }) {
  const [dataOpcao, setDataOpcao] = useState('estudando');
  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);

  // Sincronizar com o status salvo do tópico quando o componente for montado ou tópico mudar
  useEffect(() => {
    const statusDoTopico = statusTopicos[topico];
    if (statusDoTopico) {
      setDataOpcao(statusDoTopico.tipo || 'estudando');
    } else {
      setDataOpcao('estudando');
    }
  }, [topico, statusTopicos]);

  // Função para atualizar status quando data opção muda
  const handleDataOpcaoChange = (novaOpcao) => {
    setDataOpcao(novaOpcao);
    setStatusTopicos(prev => {
      let dataAgendada = '';
      if (novaOpcao === 'agendar') {
        dataAgendada = prev[topico]?.dataAgendada || '';
      }
      return {
        ...prev,
        [topico]: {
          tipo: novaOpcao,
          dataAgendada
        }
      };
    });
  };

  // Função para atualizar horário agendado
  const handleHorarioAgendadoChange = (novoHorario) => {
    const dataAgendada = statusTopicos[topico]?.dataAgendada;
    const hoje = new Date().toISOString().split('T')[0];
    
    // Se a data for hoje, validar se o horário não é anterior ao atual
    if (dataAgendada === hoje) {
      const agora = new Date();
      const horarioAtual = agora.toTimeString().slice(0, 5);
      
      if (novoHorario < horarioAtual) {
        showError('Não é possível agendar para um horário passado. Selecione um horário futuro.');
        return;
      }
    }
    
    setStatusTopicos(prev => ({
      ...prev,
      [topico]: {
        ...prev[topico],
        tipo: 'agendar',
        dataAgendada: prev[topico]?.dataAgendada || '',
        horarioAgendado: novoHorario
      }
    }));
  };

  // Função para atualizar data agendada
  const handleDataAgendadaChange = (novaData) => {
    // Validar se a data não é anterior a hoje
    const hoje = new Date().toISOString().split('T')[0];
    if (novaData < hoje) {
      // Mostrar toast de erro e não permitir a data
      showError('Não é possível agendar para uma data passada. Selecione hoje ou uma data futura.');
      return;
    }
    
    const agora = new Date();
    const horarioAtual = agora.toTimeString().slice(0, 5);
    
    setStatusTopicos(prev => {
      const topicoPrev = prev[topico] || {};
      let novoHorario = topicoPrev.horarioAgendado || '';
      
      // Se a data for hoje e o horário agendado for anterior ao atual, limpar o horário
      if (novaData === hoje && novoHorario && novoHorario < horarioAtual) {
        novoHorario = '';
      }
      
      return {
        ...prev,
        [topico]: {
          ...topicoPrev,
          tipo: dataOpcao,
          dataAgendada: novaData,
          horarioAgendado: novoHorario
        }
      };
    });
  };

  // Função para converter segundos em formato HH:MM:SS
  const formatarTempoEstudo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segundosRestantes = segundos % 60;
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Linha 1 - Status do Estudo */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--darkmode-text-primary)',
          marginBottom: '8px'
        }}>
          Status do Estudo
        </label>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="statusEstudo"
              value="estudando"
              checked={dataOpcao === 'estudando'}
              onChange={(e) => handleDataOpcaoChange(e.target.value)}
              style={{ marginRight: '4px' }}
            />
            <span style={{ color: 'var(--darkmode-text-primary)', fontSize: '14px' }}>Estudando</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="statusEstudo"
              value="ja-estudei"
              checked={dataOpcao === 'ja-estudei'}
              onChange={(e) => handleDataOpcaoChange(e.target.value)}
              style={{ marginRight: '4px' }}
            />
            <span style={{ color: 'var(--darkmode-text-primary)', fontSize: '14px' }}>Já estudei</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="statusEstudo"
              value="agendar"
              checked={dataOpcao === 'agendar'}
              onChange={(e) => handleDataOpcaoChange(e.target.value)}
              style={{ marginRight: '4px' }}
            />
            <span style={{ color: 'var(--darkmode-text-primary)', fontSize: '14px' }}>Agendar</span>
          </label>
        </div>
      </div>

      {/* Linha 2 - Agendamento (só aparece se agendar estiver selecionado) */}
      {dataOpcao === 'agendar' && (
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--darkmode-text-primary)',
          marginBottom: '8px'
        }}>
          Agendamento
        </label>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Campos de agendamento */}
          <div 
            style={{
              position: 'relative',
              cursor: 'pointer'
            }}
            onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.focus()}
          >
            <input
              ref={dateInputRef}
              type="date"
              min={new Date().toISOString().split('T')[0]} // Data mínima é hoje
              value={statusTopicos[topico]?.dataAgendada || ''}
              onChange={(e) => handleDataAgendadaChange(e.target.value)}
              style={{
                padding: '8px 35px 8px 12px',
                border: '1px solid var(--darkmode-border-secondary)',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'var(--darkmode-bg-secondary)',
                color: 'var(--darkmode-text-primary)',
                cursor: 'pointer',
                width: '150px'
              }}
            />
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                zIndex: 1
              }}
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="#FF6B35" strokeWidth="2"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke="#FF6B35" strokeWidth="2"/>
              <line x1="8" y1="2" x2="8" y2="6" stroke="#FF6B35" strokeWidth="2"/>
              <line x1="3" y1="10" x2="21" y2="10" stroke="#FF6B35" strokeWidth="2"/>
            </svg>
          </div>
          <div 
            style={{ 
              position: 'relative', 
              display: 'flex', 
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onClick={() => timeInputRef.current?.showPicker?.() || timeInputRef.current?.focus()}
          >
            <input
              ref={timeInputRef}
              type="time"
              min={(() => {
                const dataAgendada = statusTopicos[topico]?.dataAgendada;
                const hoje = new Date().toISOString().split('T')[0];
                // Se a data agendada for hoje, definir horário mínimo como agora
                if (dataAgendada === hoje) {
                  const agora = new Date();
                  return agora.toTimeString().slice(0, 5); // formato HH:MM
                }
                return ''; // Sem restrição de horário para datas futuras
              })()}
              value={statusTopicos[topico]?.horarioAgendado || ''}
              onChange={(e) => handleHorarioAgendadoChange(e.target.value)}
              style={{
                padding: '8px 35px 8px 12px',
                border: '1px solid var(--darkmode-border-secondary)',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'var(--darkmode-bg-secondary)',
                color: 'var(--darkmode-text-primary)',
                WebkitAppearance: 'none',
                MozAppearance: 'textfield',
                appearance: 'none',
                cursor: 'pointer',
                width: '120px'
              }}
            />
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
                pointerEvents: 'none'
              }}
            >
              <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          {/* Botão Remover Agendamento */}
          {(statusTopicos[topico]?.dataAgendada || statusTopicos[topico]?.horarioAgendado) && (
            <button
              onClick={() => {
                console.log('Removendo agendamento para tópico:', topico);
                console.log('Status antes:', statusTopicos[topico]);
                
                // Limpar agendamento
                setStatusTopicos(prev => ({
                  ...prev,
                  [topico]: {
                    ...prev[topico],
                    dataAgendada: '',
                    horarioAgendado: '',
                    tipo: 'estudando' // Reset para o tipo padrão
                  }
                }));
                
                console.log('Agendamento removido');
              }}
              style={{
                padding: '8px 12px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #EF4444',
                borderRadius: '6px',
                color: '#EF4444',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Remover Agendamento
            </button>
          )}
        </div>
      </div>
      )}

      {/* Linha 3 - Tópico e Material em uma linha */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {/* Tópico */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--darkmode-text-primary)',
            marginBottom: '8px'
          }}>
            Tópico
          </label>
          <input
            type="text"
            value={topicoEditado}
            onChange={(e) => setTopicoEditado(e.target.value)}
            placeholder="Digite o nome do tópico"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--darkmode-border-secondary)',
              borderRadius: '6px',
              backgroundColor: 'var(--darkmode-bg-secondary)',
              color: 'var(--darkmode-text-primary)',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Material */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--darkmode-text-primary)',
            marginBottom: '8px'
          }}>
            Material
          </label>
          <input
            type="text"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            placeholder="Ex: Livro, Vídeo, PDF, etc."
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--darkmode-border-secondary)',
              borderRadius: '6px',
              backgroundColor: 'var(--darkmode-bg-secondary)',
              color: 'var(--darkmode-text-primary)',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* Linha 3 - Comentários */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--darkmode-text-primary)',
          marginBottom: '8px'
        }}>
          Comentários
        </label>
        <textarea
          value={comentarios}
          onChange={(e) => setComentarios(e.target.value)}
          placeholder="Adicione seus comentários sobre o estudo..."
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid var(--darkmode-border-secondary)',
            borderRadius: '6px',
            backgroundColor: 'var(--darkmode-bg-secondary)',
            color: 'var(--darkmode-text-primary)',
            fontSize: '14px',
            minHeight: '80px',
            resize: 'vertical'
          }}
        />
      </div>
    </div>
  );
}

// Componente da Aba Timers
function AbaTimers({ topico, timersTopicos, setTimersTopicos, setTempoEstudoTimer, onPause, obterUltimoTempoTopico }) {
  // Armazenar o intervalId fora do estado para evitar conflitos
  const intervalRef = useRef(null);

  // Obter estado do timer para este tópico específico
  const timerTopico = timersTopicos[topico] || { tempo: 0, ativo: false, finalizado: false };

  // Atualizar tempoEstudoTimer sempre que o timer do tópico mudar
  useEffect(() => {
    setTempoEstudoTimer(timerTopico.tempo);
  }, [timerTopico.tempo, setTempoEstudoTimer]);

  const formatarTempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segundosRestantes = segundos % 60;
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
  };

  // Função para limpar interval ativo
  const limparInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const iniciarTimer = () => {
    // Limpar qualquer interval ativo
    limparInterval();

    // Obter último tempo do histórico se o timer estiver zerado
    let tempoInicial = timerTopico.tempo;
    if (tempoInicial === 0 && obterUltimoTempoTopico) {
      tempoInicial = obterUltimoTempoTopico(topico);
    }

    // Pausar todos os outros timers antes de iniciar este
    setTimersTopicos(prev => {
      const novosTimers = {};
      // Pausar todos os timers
      Object.keys(prev).forEach(key => {
        novosTimers[key] = { ...prev[key], ativo: false };
      });
      // Ativar apenas o timer atual
      novosTimers[topico] = { ...timerTopico, tempo: tempoInicial, ativo: true };
      return novosTimers;
    });

    // Criar novo interval
    intervalRef.current = setInterval(() => {
      setTimersTopicos(prev => ({
        ...prev,
        [topico]: {
          ...prev[topico],
          tempo: (prev[topico]?.tempo || 0) + 1
        }
      }));
    }, 1000);
  };

  const pausarTimer = async () => {
    // Limpar interval
    limparInterval();

    // Pausar timer para este tópico
    setTimersTopicos(prev => ({
      ...prev,
      [topico]: { ...timerTopico, ativo: false }
    }));

    // Chamar função de salvamento automático se fornecida
    if (onPause && typeof onPause === 'function') {
      await onPause(topico);
    }
  };

  const resetarTimer = () => {
    // Limpar interval
    limparInterval();
    
    // Resetar timer para este tópico
    setTimersTopicos(prev => ({
      ...prev,
      [topico]: { tempo: 0, ativo: false, finalizado: false }
    }));
  };

  // Cleanup quando componente desmonta
  useEffect(() => {
    return () => {
      limparInterval();
    };
  }, []);

  // Restaurar timer ativo quando página carrega
  useEffect(() => {
    if (timerTopico.ativo && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setTimersTopicos(prev => ({
          ...prev,
          [topico]: {
            ...prev[topico],
            tempo: (prev[topico]?.tempo || 0) + 1
          }
        }));
      }, 1000);
    }
  }, [timerTopico.ativo]);

  // Parar timer se não está mais ativo
  useEffect(() => {
    if (!timerTopico.ativo && intervalRef.current) {
      limparInterval();
    }
  }, [timerTopico.ativo]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {/* Cabeçalho minimalista */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px'
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="var(--orange-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h4 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--darkmode-text-primary)',
          margin: 0
        }}>
          Timer de Estudo - {topico}
        </h4>
      </div>

      {/* Timer Único - Design simplificado */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
        backgroundColor: timerTopico.ativo ? 'rgba(245, 158, 11, 0.1)' : 'var(--darkmode-bg-tertiary)',
        borderRadius: '12px',
        border: `2px solid ${timerTopico.ativo ? 'var(--orange-primary)' : 'var(--darkmode-border-secondary)'}`,
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          {/* Display do Timer - Maior */}
          <div style={{
            fontSize: '48px',
            fontWeight: '700',
            color: timerTopico.ativo ? 'var(--orange-primary)' : 'var(--darkmode-text-primary)',
            fontFamily: 'monospace',
            textAlign: 'center',
            textShadow: timerTopico.ativo ? '0 0 15px rgba(245, 158, 11, 0.4)' : 'none',
            letterSpacing: '2px'
          }}>
            {formatarTempo(timerTopico.tempo)}
          </div>

          {/* Botões de Controle */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            {!timerTopico.ativo ? (
              <button
                onClick={iniciarTimer}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'var(--darkmode-button-success)',
                  color: 'var(--darkmode-bg-secondary)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                ▶ Iniciar
              </button>
            ) : (
              <button
                onClick={pausarTimer}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#F59E0B',
                  color: 'var(--darkmode-bg-secondary)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                ⏸ Pausar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Informações do Timer */}
      <div style={{
        padding: '12px',
        backgroundColor: 'var(--darkmode-bg-tertiary)',
        borderRadius: '6px',
        border: '1px solid var(--darkmode-border-secondary)',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '12px',
          color: 'var(--darkmode-text-secondary)',
          marginBottom: '4px'
        }}>
          Status do Timer
        </div>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: timerTopico.ativo ? 'var(--orange-primary)' : 'var(--darkmode-text-primary)'
        }}>
          {timerTopico.ativo ? 'Em execução' : 'Parado'}
        </div>
      </div>
    </div>
  );
}

// Componente da Aba Links
function AbaLinks({ links, setLinks }) {
  const adicionarLink = () => {
    setLinks([...links, { titulo: '', url: '' }]);
  };

  const removerLink = (index) => {
    const novosLinks = links.filter((_, i) => i !== index);
    setLinks(novosLinks.length > 0 ? novosLinks : [{ titulo: '', url: '' }]);
  };

  const atualizarLink = (index, campo, valor) => {
    const novosLinks = [...links];
    novosLinks[index][campo] = valor;
    setLinks(novosLinks);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h4 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: 'var(--darkmode-text-primary)',
          margin: 0
        }}>
          Links de Estudo
        </h4>
        <button
          onClick={adicionarLink}
          style={{
            padding: '8px 12px',
            backgroundColor: 'var(--orange-primary)',
            color: 'var(--darkmode-bg-secondary)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500'
          }}
        >
          + Adicionar Link
        </button>
      </div>

      {links.map((link, index) => (
        <div key={index} style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          padding: '15px',
          backgroundColor: 'var(--darkmode-bg-tertiary)',
          borderRadius: '6px',
          border: '1px solid var(--darkmode-border-secondary)'
        }}>
          <div style={{ 
            flex: '0 0 200px',
            minWidth: '200px'
          }}>
            <input
              type="text"
              placeholder="Título do link"
              value={link.titulo}
              onChange={(e) => atualizarLink(index, 'titulo', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid var(--darkmode-border-secondary)',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          <div className="flex-1">
            <input
              type="url"
              placeholder="https://exemplo.com"
              value={link.url}
              onChange={(e) => atualizarLink(index, 'url', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid var(--darkmode-border-secondary)',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          {links.length > 1 && (
            <button
              onClick={() => removerLink(index)}
              style={{
                padding: '8px 10px',
                backgroundColor: 'var(--darkmode-button-danger)',
                color: 'var(--darkmode-bg-secondary)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                flexShrink: 0
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// Componente da Aba Detalhes
function AbaDetalhes({ questoesPlanejadas, setQuestoesPlanejadas, questoesRealizadas, setQuestoesRealizadas }) {
  
  // Função para validar e ajustar questões corretas
  const handleQuestoesRealizadasChange = (valor) => {
    const novoValor = parseInt(valor) || 0;
    setQuestoesRealizadas(novoValor);
    
    // Se questões corretas for menor que as questões erradas atuais, 
    // ajustar questões planejadas para manter a consistência
    const questoesErradasAtuais = Math.max(0, questoesPlanejadas - questoesRealizadas);
    if (novoValor < questoesErradasAtuais) {
      setQuestoesPlanejadas(novoValor + questoesErradasAtuais);
    } else {
      // Se aumentou as corretas, manter as planejadas igual ou maior
      if (novoValor > questoesPlanejadas) {
        setQuestoesPlanejadas(novoValor);
      }
    }
  };
  
  // Função para validar questões planejadas (através das erradas)
  const handleQuestoesPlanjadasChange = (valor) => {
    const novoValor = parseInt(valor) || 0;
    setQuestoesPlanejadas(novoValor);
    
    // Garantir que questões planejadas seja pelo menos igual às realizadas
    if (novoValor < questoesRealizadas) {
      setQuestoesPlanejadas(questoesRealizadas);
    }
  };  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Questões - Lado a lado */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Questões Corretas */}
        <div>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--darkmode-text-primary)',
            marginBottom: '12px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Questões Corretas
          </label>
          <input
            type="number"
            value={questoesRealizadas}
            onChange={(e) => handleQuestoesRealizadasChange(e.target.value)}
            min="0"
            style={{
              width: '100%',
              height: '120px',
              padding: '30px',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              fontSize: '60px',
              textAlign: 'center',
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}
          />
        </div>

        {/* Questões Erradas */}
        <div>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--darkmode-text-primary)',
            marginBottom: '12px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 14L12 12M12 12L14 10M12 12L10 10M12 12L14 14M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Questões Erradas
          </label>
          <input
            type="number"
            value={Math.max(0, questoesPlanejadas - questoesRealizadas)}
            onChange={(e) => {
              const questoesErradas = parseInt(e.target.value) || 0;
              const novasQuestoesPlanejadas = questoesRealizadas + questoesErradas;
              handleQuestoesPlanjadasChange(novasQuestoesPlanejadas);
            }}
            min="0"
            style={{
              width: '100%',
              height: '120px',
              padding: '30px',
              border: '2px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              fontSize: '60px',
              textAlign: 'center',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Componente da Aba Histórico
function AbaHistorico({ registrosEstudo, carregandoRegistros, disciplina }) {
  if (carregandoRegistros) {
    return <SkeletonList count={4} />;
  }

  if (!registrosEstudo || registrosEstudo.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: 'var(--darkmode-text-secondary)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
        <h4 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'var(--darkmode-text-primary)',
          margin: '0 0 8px 0'
        }}>
          Nenhum registro encontrado
        </h4>
        <p style={{
          fontSize: '14px',
          color: 'var(--darkmode-text-secondary)',
          margin: 0
        }}>
          Você ainda não registrou estudos para esta disciplina.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h4 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: 'var(--darkmode-text-primary)',
          margin: 0
        }}>
          Histórico de Estudos ({registrosEstudo.length})
        </h4>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {registrosEstudo.map((registro, index) => (
          <div
            key={registro._id || index}
            style={{
              padding: '20px',
              backgroundColor: 'var(--darkmode-bg-tertiary)',
              borderRadius: '12px',
              border: '1px solid var(--darkmode-border-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Cabeçalho do registro */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '15px'
            }}>
              <div>
                <h5 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--darkmode-text-primary)',
                  margin: '0 0 5px 0'
                }}>
                  {registro.topico || 'Tópico não informado'}
                </h5>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--darkmode-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flexWrap: 'wrap'
                }}>
                  <span>📅 {new Date(registro.data || registro.createdAt).toLocaleDateString('pt-BR')}</span>
                  {registro.iniciadaEm && (
                    <span>🟢 Início: {new Date(registro.iniciadaEm).toLocaleTimeString('pt-BR')}</span>
                  )}
                  {registro.finalizadaEm && (
                    <span>🔴 Fim: {new Date(registro.finalizadaEm).toLocaleTimeString('pt-BR')}</span>
                  )}
                  <span>⏱️ {Math.floor((registro.tempoEstudo || 0) / 60)}min {String((registro.tempoEstudo || 0) % 60).padStart(2, '0')}s</span>
                  {registro.estudoFinalizado && <span style={{ color: 'var(--darkmode-button-success)' }}>✅ Finalizado</span>}
                  {!registro.estudoFinalizado && <span style={{ color: '#F59E0B' }}>⏳ Em andamento</span>}
                </div>
              </div>
            </div>

            {/* Conteúdo do registro */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '15px'
            }}>
              {/* Material */}
              <div>
                <label style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--darkmode-text-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '5px',
                  display: 'block'
                }}>
                  📖 Material
                </label>
                <div style={{
                  fontSize: '14px',
                  color: 'var(--darkmode-text-primary)',
                  backgroundColor: 'var(--darkmode-bg-secondary)',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--darkmode-border-secondary)',
                  minHeight: '40px'
                }}>
                  {registro.material || 'Não informado'}
                </div>
              </div>

              {/* Comentários */}
              <div>
                <label style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--darkmode-text-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '5px',
                  display: 'block'
                }}>
                  💬 Comentários
                </label>
                <div style={{
                  fontSize: '14px',
                  color: 'var(--darkmode-text-primary)',
                  backgroundColor: 'var(--darkmode-bg-secondary)',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--darkmode-border-secondary)',
                  minHeight: '40px'
                }}>
                  {registro.observacoes || 'Não informado'}
                </div>
              </div>
            </div>

            {/* Links (se houver) */}
            {registro.links && registro.links.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <label style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--darkmode-text-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '5px',
                  display: 'block'
                }}>
                  🔗 Links ({registro.links.length})
                </label>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px'
                }}>
                  {registro.links.map((link, linkIndex) => (
                    <div key={linkIndex} style={{
                      fontSize: '13px',
                      backgroundColor: 'var(--darkmode-bg-secondary)',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid var(--darkmode-border-secondary)'
                    }}>
                      <strong>{link.titulo}:</strong> <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--orange-primary)' }}>{link.url}</a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Questões (sempre mostrar) */}
            <div style={{
              marginTop: '15px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '15px',
              fontSize: '13px',
              backgroundColor: 'var(--darkmode-bg-secondary)',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid var(--darkmode-border-secondary)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: '600', color: '#10B981', fontSize: '16px' }}>
                  {registro.questoesPlanejadas || 0}
                </div>
                <div style={{ color: 'var(--darkmode-text-secondary)' }}>✅ Corretas</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: '600', color: '#EF4444', fontSize: '16px' }}>
                  {registro.questoesRealizadas || 0}
                </div>
                <div style={{ color: 'var(--darkmode-text-secondary)' }}>❌ Erradas</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontWeight: '600', 
                  fontSize: '16px',
                  color: registro.questoesPlanejadas > 0 ? 
                    (registro.questoesRealizadas >= registro.questoesPlanejadas ? 'var(--darkmode-button-success)' : '#F59E0B') : 
                    'var(--darkmode-text-secondary)'
                }}>
                  {registro.questoesPlanejadas > 0 ? 
                    Math.round((registro.questoesRealizadas / registro.questoesPlanejadas) * 100) : 
                    0}%
                </div>
                <div style={{ color: 'var(--darkmode-text-secondary)' }}>📊 Progresso</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente Timer para cada Tópico
function TimerTopico({ topico, timersTopicos, setTimersTopicos, onPause, obterUltimoTempoTopico, token, disciplina, planoId }) {
  const intervalRef = useRef(null);

  // Obter estado do timer para este tópico específico
  const timerTopico = timersTopicos[topico] || { tempo: 0, ativo: false, finalizado: false };

  const formatarTempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segundosRestantes = segundos % 60;
    
    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
    }
    return `${minutos}:${segundosRestantes.toString().padStart(2, '0')}`;
  };

  // Função para limpar interval ativo
  const limparInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const iniciarTimer = async (e) => {
    e.stopPropagation();
    
    // Limpar qualquer interval ativo
    limparInterval();

    // Obter último tempo do histórico se o timer estiver zerado
    let tempoInicial = timerTopico.tempo;
    if (tempoInicial === 0 && obterUltimoTempoTopico) {
      tempoInicial = obterUltimoTempoTopico(topico);
    }

    // Pausar todos os outros timers antes de iniciar este
    setTimersTopicos(prev => {
      const novosTimers = {};
      // Pausar todos os timers
      Object.keys(prev).forEach(key => {
        novosTimers[key] = { ...prev[key], ativo: false };
      });
      // Ativar apenas o timer atual
      novosTimers[topico] = { ...timerTopico, tempo: tempoInicial, ativo: true };
      return novosTimers;
    });

    // Adicionar tópico às revisões quando timer for iniciado
    try {
      const response = await fetch(`${API_BASE_URL}/api/revisoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          topico: topico,
          disciplinaId: disciplina._id,
          disciplinaNome: disciplina.nome,
          planoId: planoId,
          dataInicio: new Date().toISOString(),
          cor: disciplina.cor || 'azul'
        })
      });

      if (response.ok) {
        console.log(`✅ Tópico "${topico}" adicionado às revisões`);
      } else {
        console.error('Erro ao adicionar tópico às revisões');
      }
    } catch (error) {
      console.error('Erro ao adicionar tópico às revisões:', error);
    }

    // Criar novo interval
    intervalRef.current = setInterval(() => {
      setTimersTopicos(prev => ({
        ...prev,
        [topico]: {
          ...prev[topico],
          tempo: (prev[topico]?.tempo || 0) + 1
        }
      }));
    }, 1000);
  };

  const pausarTimer = async (e) => {
    e.stopPropagation();
    
    // Limpar interval
    limparInterval();

    // Pausar timer para este tópico
    setTimersTopicos(prev => ({
      ...prev,
      [topico]: { ...timerTopico, ativo: false }
    }));

    // Chamar função de salvamento automático se fornecida
    if (onPause && typeof onPause === 'function') {
      await onPause(topico);
    }
  };

  const resetarTimer = (e) => {
    e.stopPropagation();
    
    // Limpar interval
    limparInterval();
    
    // Resetar timer para este tópico
    setTimersTopicos(prev => ({
      ...prev,
      [topico]: { tempo: 0, ativo: false, finalizado: false }
    }));
  };

  // Cleanup quando componente desmonta
  useEffect(() => {
    return () => {
      limparInterval();
    };
  }, []);

  // Restaurar timer ativo quando página carrega
  useEffect(() => {
    if (timerTopico.ativo && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setTimersTopicos(prev => ({
          ...prev,
          [topico]: {
            ...prev[topico],
            tempo: (prev[topico]?.tempo || 0) + 1
          }
        }));
      }, 1000);
    }
  }, [timerTopico.ativo]);

  // Parar timer se não está mais ativo
  useEffect(() => {
    if (!timerTopico.ativo && intervalRef.current) {
      limparInterval();
    }
  }, [timerTopico.ativo]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 10px',
      backgroundColor: timerTopico.ativo ? 'rgba(245, 158, 11, 0.1)' : 'var(--darkmode-bg-tertiary)',
      borderRadius: '8px',
      border: `1px solid ${timerTopico.ativo ? 'var(--orange-primary)' : 'var(--darkmode-border-secondary)'}`,
      minWidth: '130px'
    }}>
      {/* Display do Timer */}
      <div style={{
        fontSize: '14px',
        fontWeight: '600',
        color: timerTopico.ativo ? 'var(--orange-primary)' : 'var(--darkmode-text-primary)',
        fontFamily: 'monospace',
        minWidth: '55px'
      }}>
        {formatarTempo(timerTopico.tempo)}
      </div>

      {/* Botões de Controle lado a lado */}
      <div style={{
        display: 'flex',
        gap: '4px',
        alignItems: 'center'
      }}>
        {!timerTopico.ativo ? (
          <button
            onClick={iniciarTimer}
            style={{
              padding: '4px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Iniciar timer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 5V19L19 12L8 5Z" fill="var(--darkmode-button-success)" stroke="var(--darkmode-button-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ) : (
          <button
            onClick={pausarTimer}
            style={{
              padding: '4px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Pausar timer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 4H6V20H10V4ZM18 4H14V20H18V4Z" fill="#F59E0B" stroke="#F59E0B" strokeWidth="2"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// Final da função DisciplinaDetalhes com Toaster

export default DisciplinaDetalhes;
