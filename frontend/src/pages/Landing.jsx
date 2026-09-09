import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, PlayCircle, GraduationCap, BookOpen, Building, Globe, Target, ListTodo, BarChart3, Zap, CheckCircle2, TrendingUp, BellRing } from 'lucide-react';

const Landing = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <div className="ai-badge">
              <Sparkles size={14} /> AI-Powered Financial Assistant
            </div>
            <h1 className="hero-title">
              Mastering Your Money with <span className="highlight-text">AI-Powered</span> Budgeting.
            </h1>
            <p className="hero-subtitle">
              Built specifically for students. Track expenses effortlessly, set smart category limits, and let our personalized AI give you actionable tips to save more and stress less.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">Start Saving Now</Link>
              <button className="btn btn-outline btn-lg"><PlayCircle size={20} /> Watch Demo</button>
            </div>
          </div>
          
          <div className="hero-mockup-wrapper">
            <div className="hero-mockup">
              <div className="mockup-header">
                <span>Dashboard Overview</span>
                <span>•••</span>
              </div>
              <div className="mockup-content">
                <div style={{color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.2rem'}}>Total Balance</div>
                <div style={{fontSize: '2rem', fontWeight: 700, marginBottom: '2rem'}}>$2,450.00</div>
                <div className="mockup-chart">
                  <div className="bar grey"></div>
                  <div className="bar grey" style={{height: '60%'}}></div>
                  <div className="bar green highlight">
                    <span className="bar-tooltip">+$120</span>
                  </div>
                  <div className="bar grey" style={{height: '70%'}}></div>
                  <div className="bar grey" style={{height: '40%'}}></div>
                  <div className="bar grey" style={{height: '30%'}}></div>
                </div>
              </div>
            </div>
            
            {/* Floating Alert Mockup */}
            <div className="floating-alert" style={{ bottom: '-20px', left: '-40px' }}>
              <div className="alert-icon" style={{background: '#027a48', color: 'white'}}><Sparkles size={16}/></div>
              <div className="alert-text">
                <div className="alert-title" style={{display: 'flex', justifyContent: 'space-between'}}>
                  <span>AI Saving Tip</span>
                  <span style={{color: 'var(--text-primary)'}}>-$15.50</span>
                </div>
                <div className="alert-desc">You've spent $45 on coffee this week. Try brewing at home to save ~$30!</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="trusted-section">
        <div className="container">
          <p className="trusted-title">BUILT FOR STUDENTS, BY STUDENTS. TRUSTED ACROSS CAMPUSES.</p>
          <div className="trusted-logos">
            <div className="logo-item"><GraduationCap size={24}/> State Univ</div>
            <div className="logo-item"><BookOpen size={24}/> Tech Institute</div>
            <div className="logo-item"><Building size={24}/> City College</div>
            <div className="logo-item"><Globe size={24}/> Global U</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <div className="container">
          <div className="section-header text-center">
            <h2>Everything you need to succeed.</h2>
            <p>Powerful tools wrapped in a minimal, stress-free interface.</p>
          </div>
          
          <div className="features-grid">
            {/* Feature 1 */}
            <div className="feature-card">
              <div className="feature-icon" style={{background: '#d1fadf', color: '#027a48'}}><Target size={20}/></div>
              <h3>Smart Budgeting</h3>
              <p>Set monthly limits per category. We'll warn you before you overspend with intuitive color-coded progress rings.</p>
              
              <div className="feature-mockup mockup-sm">
                <div className="progress-ring-mockup">
                  <div className="ring">75%</div>
                  <div className="ring-text">
                    <strong>Groceries</strong>
                    <span>$150 / $200 spent</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="feature-card">
              <div className="feature-icon" style={{background: '#e0e7ff', color: '#4338ca'}}><ListTodo size={20}/></div>
              <h3>Effortless Tracking</h3>
              <p>Log transactions quickly. See your balance and recent activity at a single glance.</p>
              
              <div className="feature-mockup mockup-sm">
                <div className="list-mockup">
                  <div className="list-item"><span>Books</span> <span>-$45</span></div>
                  <div className="list-item"><span>Transport</span> <span>-$12</span></div>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="feature-card">
              <div className="feature-icon" style={{background: '#ffedd5', color: '#ea580c'}}><BarChart3 size={20}/></div>
              <h3>Visual Analytics</h3>
              <p>Beautiful charts help you understand exactly where your money goes every month.</p>
              
              <div className="feature-mockup mockup-sm" style={{display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '1rem'}}>
                <div style={{flex: 1, background: '#fed7aa', height: '40px', borderRadius: '4px'}}></div>
                <div style={{flex: 1, background: '#9a3412', height: '80px', borderRadius: '4px'}}></div>
                <div style={{flex: 1, background: '#fdba74', height: '60px', borderRadius: '4px'}}></div>
                <div style={{flex: 1, background: '#ffedd5', height: '20px', borderRadius: '4px'}}></div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="feature-card">
              <div className="feature-icon" style={{background: '#d1fae5', color: '#059669'}}><Zap size={20}/></div>
              <h3>AI Saving Assistant</h3>
              <p>Our smart engine analyzes your spending patterns to find hidden savings. It's like having a financial advisor in your pocket, tailored for student life.</p>
              
              <div className="feature-mockup mockup-sm" style={{padding: '1rem'}}>
                <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
                  <BellRing size={16} color="#059669"/>
                  <div style={{fontSize: '0.75rem'}}>
                    <strong style={{display: 'block'}}>Subscription Alert</strong>
                    <span style={{color: 'var(--text-secondary)'}}>You haven't used "StreamFlix" in 2 months. Cancel to save $14.99/mo?</span>
                  </div>
                </div>
                <button className="btn btn-outline" style={{width: '100%', fontSize: '0.75rem', padding: '0.4rem'}}>Review Subscriptions</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Detail Section */}
      <section className="ai-detail-section">
        <div className="container">
          <div className="ai-detail-grid">
            <div className="ai-mockups-column">
              <div className="floating-card c-1">
                <div style={{display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', color: '#059669'}}>
                  <CheckCircle2 size={16}/> <strong>Campus Deal</strong>
                </div>
                <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>Use your student ID at Campus Coffee today for 15% off.</p>
              </div>
              
              <div className="floating-card c-2">
                <div style={{marginBottom: '8px', fontWeight: 600}}>High Spending</div>
                <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px'}}>We noticed you spent 20% more on food this month.</p>
                <div style={{height: '6px', background: '#fee2e2', borderRadius: '4px', overflow: 'hidden'}}>
                  <div style={{width: '95%', background: '#ef4444', height: '100%'}}></div>
                </div>
                <div style={{fontSize: '0.7rem', color: '#ef4444', marginTop: '4px'}}>95% of Budget Limit</div>
              </div>

              <div className="floating-card c-3">
                <div style={{display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', color: '#3b82f6'}}>
                  <TrendingUp size={16}/> <strong>Goal Reached!</strong>
                </div>
                <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>You saved $50 this week. Transfer to savings?</p>
              </div>
            </div>
            
            <div className="ai-text-column">
              <h2>AI that actually understands student life.</h2>
              <p>
                Forget generic financial advice. Expendicure's AI analyzes your unique spending patterns against typical student expenses. It finds tailored discounts, alerts you to forgotten subscriptions, and helps you stretch every dollar until the end of the semester.
              </p>
              <ul className="feature-list">
                <li><CheckCircle2 size={18} color="#027a48" /> Context-aware spending alerts</li>
                <li><CheckCircle2 size={18} color="#027a48" /> Automated student discount matching</li>
                <li><CheckCircle2 size={18} color="#027a48" /> Weekly behavioral insights</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-banner">
            <h2>Take Control of Your Financial Future.</h2>
            <p>Join thousands of students who are building better financial habits today. It takes less than 2 minutes to get started.</p>
            <Link to="/register" className="btn btn-primary" style={{background: '#064e3b', color: 'white'}}>Create Free Account &rarr;</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
