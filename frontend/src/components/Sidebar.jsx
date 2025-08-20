import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

function Sidebar({ onOpenPerfil }) {
  const { logout, user } = useAuth();
  const location = useLocation();
  
  const userMenu = [
    { to: "/planos", label: "Cadastrar Disciplinas" },
    // { to: "/disciplinas", label: "Disciplinas" },
    { to: "/revisoes", label: "Revisões" },
    { to: "/historico", label: "Histórico" },
    { to: "/estatisticas", label: "Estatísticas" }
  ];
  
  const adminMenu = [
    { to: "/admin/usuarios", label: "Usuários" },
    { to: "/admin/categorias", label: "Categorias" },
    { to: "/admin/instituicoes", label: "Instituições" },
    { to: "/admin/disciplinas", label: "Disciplinas" }
  ];
  
  const menuItems = user?.role === 'admin' ? adminMenu : userMenu;
  
  const isActiveItem = (itemPath) => {
    const currentPath = location.pathname;
    
    if (itemPath === currentPath) {
      return true;
    }
    
    if (itemPath !== '/' && currentPath.startsWith(itemPath)) {
      const moreSpecificRoutes = menuItems.some(item => 
        item.to !== itemPath && 
        item.to.startsWith(itemPath) && 
        currentPath.startsWith(item.to)
      );
      
      return !moreSpecificRoutes;
    }
    
    return false;
  };
  
  const homeLink = user?.role === 'admin' ? '/admin' : '/planos';

  return (
    <aside className='flex align-center justify-between sidebar'>
      <header className='flex align-center'>
        <span className="logo"><img src="/logo.png" /></span>
        <h1>
          <Link to={homeLink}>
            Resumos | Concursos <small>@Radegondes</small>
          </Link>
        </h1>
      </header>
      <nav>
        <ul className='flex align-center'>
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link 
                to={item.to}
                className={isActiveItem(item.to) ? 'active' : ''}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="user">
        <span className="flex flex-col op1">
          <small>Olá, {user?.nome}</small>
        </span>
        <span className='op2'>
          {user?.avatar ? (
            <img 
              src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`} 
              alt="Avatar" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                borderRadius: '100%'
              }} 
            />
          ) : (
            user?.nome ? user.nome.slice(0,2).toUpperCase() : ''
          )}
        </span>
        <i className="fa-light fa-angle-down"></i>
        <nav className="user-menu">
          <ul>
            <li><a href="#" onClick={(e) => { e.preventDefault(); onOpenPerfil(); }}>Meu Perfil</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>Sair</a></li>
          </ul>
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;
