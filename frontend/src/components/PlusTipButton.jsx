import { useNavigate } from 'react-router-dom';
    import { useAuth } from '../context/AuthContext';
    import './PlusTipButton.css';
    
    /**
     * A floating plus button that navigates to the tip submission page.
     * Visible only for SENIOR role users.
     */
    export default function PlusTipButton() {
      const navigate = useNavigate();
      const { user } = useAuth();
    
      if (!user || user.role !== 'SENIOR') return null;
    
      return (
        <button
          className="plus-tip-btn"
          onClick={() => navigate('/submit')}
          title="Add a Tip"
        >
          +
        </button>
      );
    }
