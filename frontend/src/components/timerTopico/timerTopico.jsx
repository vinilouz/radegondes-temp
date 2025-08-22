import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config/api';


function TimerTopico({ indice, topico, timersTopicos, setTimersTopicos, onPause, obterUltimoTempoTopico, token, disciplina, planoId }) {
  
  const intervalRef = useRef(null);
  const chaveUnica = `${topico}-${indice}`;

  const timerTopico = timersTopicos[chaveUnica] || { tempo: 0, ativo: false, finalizado: false };

  const formatarTempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segundosRestantes = segundos % 60;

    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
    }
    return `${minutos}:${segundosRestantes.toString().padStart(2, '0')}`;
  };

  const limparInterval = () => {
    console.log(`🧹 Limpando interval para ${topico}:`, intervalRef.current);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log(`✅ Interval limpo para ${topico}`);
    }
  };

  const iniciarTimer = async (e) => {
    e.stopPropagation();

    console.log(`▶️ Iniciando timer para ${topico}`);

    // IMPORTANTE: Limpar qualquer interval ativo ANTES de criar novo
    limparInterval();

    // Obter último tempo do histórico se o timer estiver zerado
    let tempoInicial = timerTopico.tempo;
    if (tempoInicial === 0 && obterUltimoTempoTopico) {
      tempoInicial = obterUltimoTempoTopico(topico);
    }
    
    // Pausar todos os outros timers antes de iniciar este
    setTimersTopicos(prev => {
      const novosTimers = {};
      Object.keys(prev).forEach(key => {
        novosTimers[key] = { ...prev[key], ativo: false };
      });
      novosTimers[chaveUnica] = { ...timerTopico, tempo: tempoInicial, ativo: true };
      console.log(`🔄 Estado dos timers atualizado:`, novosTimers);
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

    // NOTA: Não criar interval aqui - deixar o useEffect fazer isso
    // para evitar condições de corrida
  };

  const pausarTimer = async (e) => {
    e.stopPropagation();

    console.log(`⏸️ Pausando timer para ${topico}`);
    
    // Limpar interval primeiro
    limparInterval();

    // Pausar timer para este tópico usando a chave única
    setTimersTopicos(prev => {
      const novoEstado = {
        ...prev,
        [chaveUnica]: { ...prev[chaveUnica], ativo: false }
      };
      console.log(`🔄 Timer pausado - Estado atualizado:`, novoEstado[chaveUnica]);
      return novoEstado;
    });

    // Chamar função de salvamento automático se fornecida
    if (onPause && typeof onPause === 'function') {
      try {
        await onPause(topico, chaveUnica);
        console.log(`💾 Salvamento automático executado para: ${topico}`);
      } catch (error) {
        console.error('Erro no salvamento automático:', error);
      }
    }
  };

  const resetarTimer = (e) => {
    e.stopPropagation();
    
    console.log(`🔄 Resetando timer para ${topico}`);
    
    // Limpar interval
    limparInterval();
    // Resetar timer para este tópico usando a chave única
    setTimersTopicos(prev => ({
      ...prev,
      [chaveUnica]: { tempo: 0, ativo: false, finalizado: false }
    }));
    
    console.log(`✅ Timer resetado para ${topico}`);
  };

  // Cleanup quando componente desmonta
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let shouldCreateInterval = false;
    let shouldClearInterval = false;

    if (timerTopico.ativo && !intervalRef.current) {
      shouldCreateInterval = true;
    } 
    else if (!timerTopico.ativo && intervalRef.current) {
      shouldClearInterval = true;
    }

    if (shouldCreateInterval) {
      console.log(`🚀 Criando interval para ${topico}`);
      intervalRef.current = setInterval(() => {
        setTimersTopicos(prev => ({
          ...prev,
          [chaveUnica]: {
            ...prev[chaveUnica],
            tempo: (prev[chaveUnica]?.tempo || 0) + 1
          }
        }));
      }, 1000);
    } else if (shouldClearInterval) {
      console.log(`⏸️ Limpando interval para ${topico}`);
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

export default TimerTopico;