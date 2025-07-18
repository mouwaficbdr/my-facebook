import { useState, useEffect } from 'react';
import { fetchDashboardStats } from '../../api/admin';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useToast } from '../../hooks/useToast';
import {
  Users,
  FileText,
  Trash2,
  UserPlus,
  TrendingUp,
  Activity,
  Calendar,
  BarChart3,
} from 'lucide-react';

interface DashboardStats {
  stats: {
    total_users: number;
    total_posts: number;
    deleted_posts: number;
    pending_friend_requests: number;
    new_users_week: number;
    new_posts_week: number;
    active_users_month: number;
  };
  activity_chart: Array<{ date: string; posts_count: number }>;
  gender_stats: Array<{ genre: string; count: number }>;
  top_users: Array<{
    id: number;
    prenom: string;
    nom: string;
    email: string;
    posts_count: number;
  }>;
}

export default function AdminDashboard() {
  const { user } = useAdminAuth();
  const { success, error } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await fetchDashboardStats();
      setStats(data);
    } catch (err: any) {
      error(err.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Impossible de charger les statistiques</p>
        <button
          onClick={loadStats}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Utilisateurs totaux',
      value: stats.stats.total_users,
      icon: Users,
      color: 'bg-blue-500',
      change: `+${stats.stats.new_users_week} cette semaine`,
    },
    {
      title: 'Posts publiés',
      value: stats.stats.total_posts,
      icon: FileText,
      color: 'bg-green-500',
      change: `+${stats.stats.new_posts_week} cette semaine`,
    },
    {
      title: 'Posts supprimés',
      value: stats.stats.deleted_posts,
      icon: Trash2,
      color: 'bg-red-500',
      change: 'Modération',
    },
    {
      title: "Demandes d'amis",
      value: stats.stats.pending_friend_requests,
      icon: UserPlus,
      color: 'bg-yellow-500',
      change: 'En attente',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Tableau de bord administrateur
            </h1>
            <p className="text-gray-600 mt-1">
              Bienvenue, {user?.prenom} {user?.nom} ({user?.role})
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>{new Date().toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {card.value.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">{card.change}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Activité des 7 derniers jours
            </h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {stats.activity_chart.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {new Date(day.date).toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (day.posts_count /
                            Math.max(
                              ...stats.activity_chart.map((d) => d.posts_count)
                            )) *
                            100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">
                    {day.posts_count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gender Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Répartition par genre
            </h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {stats.gender_stats.map((stat, index) => {
              const colors = ['bg-blue-500', 'bg-pink-500', 'bg-purple-500'];
              const percentage = (stat.count / stats.stats.total_users) * 100;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {stat.genre}
                    </span>
                    <span className="text-sm text-gray-500">
                      {stat.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${
                        colors[index % colors.length]
                      } h-2 rounded-full`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Users */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Utilisateurs les plus actifs
          </h3>
          <Activity className="h-5 w-5 text-gray-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Utilisateur
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Email
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">
                  Posts
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.top_users.map((user, index) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            #{index + 1}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.prenom} {user.nom}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {user.posts_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Actions rapides
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Users className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">
              Gérer les utilisateurs
            </span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <FileText className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">
              Modérer les posts
            </span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <BarChart3 className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">
              Voir les rapports
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
