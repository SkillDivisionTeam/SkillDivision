import React from 'react';
import { Mail, Shield, Award } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { User as UserType } from '../types';
import { Card, Badge } from '../components/UI';

interface ProfileProps {
  user: UserType;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  // Safe default data if skills_profile is missing
  const data = user.skills_profile || [
    { topic: "General", score: 50, max_score: 100 },
    { topic: "Logic", score: 50, max_score: 100 },
    { topic: "Speed", score: 50, max_score: 100 },
  ];

  const getRoleName = (role: string) => {
    switch(role) {
      case 'admin': return 'АДМИНИСТРАТОР';
      case 'hr': return 'HR-СПЕЦИАЛИСТ';
      default: return 'УЧАСТНИК';
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* User Info Card */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary-500 to-secondary-500 p-1 mb-4">
                <img 
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=0f172a&color=fff`} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover border-4 border-slate-900"
                />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">@{user.username}</h2>
              <Badge color={user.role === 'admin' ? 'red' : 'blue'}>
                {getRoleName(user.role)}
              </Badge>

              <div className="w-full mt-8 space-y-4 text-left">
                <div className="flex items-center text-slate-400 p-3 bg-slate-800/50 rounded-lg">
                  <Mail className="w-5 h-5 mr-3 text-slate-500" />
                  <span className="text-sm truncate">{user.email}</span>
                </div>
                <div className="flex items-center text-slate-400 p-3 bg-slate-800/50 rounded-lg">
                  <Shield className="w-5 h-5 mr-3 text-slate-500" />
                  <span className="text-sm">ID Аккаунта: #{user.id}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Analytics Card */}
        <div className="lg:col-span-2">
          <Card className="h-full min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-xl font-bold text-white flex items-center gap-2">
                 <Award className="text-primary-400" /> Матрица компетенций
               </h3>
               <span className="text-sm text-slate-500">На основе результатов квизов</span>
            </div>
            
            <div className="flex-grow w-full h-full min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="topic" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569' }} />
                  <Radar
                    name="Уровень навыка"
                    dataKey="score"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fill="#8b5cf6"
                    fillOpacity={0.3}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                    itemStyle={{ color: '#c4b5fd' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;