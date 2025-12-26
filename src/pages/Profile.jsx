import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  User, Mail, Phone, Building2, Calendar, Shield,
  Save, Loader2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import PageHeader from '@/components/ui/PageHeader';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    phone: '',
    department: '',
    title: '',
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setFormData({
        phone: currentUser.phone || '',
        department: currentUser.department || '',
        title: currentUser.title || '',
      });
      setLoading(false);
    };
    loadUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.auth.updateMe(formData);
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Profile Settings"
        description="Manage your account information"
      />

      {/* Profile Header */}
      <Card className="mb-6 border-slate-200/80">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-slate-800 text-white text-2xl font-medium">
                {user?.fullname?.charAt(0)?.toUpperCase() || user?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-slate-900">
                {user?.fullname || user?.full_name || 'User'}
              </h2>
              <p className="text-slate-500 mt-1">{user?.email}</p>
              <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
                <Badge className={user?.role === 'admin' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-slate-100 text-slate-700'
                }>
                  <Shield className="h-3 w-3 mr-1" />
                  {user?.role}
                </Badge>
                {user?.status && (
                  <Badge className={user?.status === 'active' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-slate-100 text-slate-600'
                  }>
                    {user?.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card className="border-slate-200/80">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  Email
                </Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="mt-1.5 bg-slate-50"
                />
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={user?.fullname || user?.full_name || ''}
                  disabled
                  className="mt-1.5 bg-slate-50"
                />
                <p className="text-xs text-slate-500 mt-1">Name is managed by the system</p>
              </div>

              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="department" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  Department
                </Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g., Operations"
                  className="mt-1.5"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  Job Title
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Service Technician"
                  className="mt-1.5"
                />
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card className="mt-6 border-slate-200/80">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-500">Account Created</p>
              <p className="font-medium text-slate-900 mt-1">
                {user?.created_date 
                  ? format(parseISO(user.created_date), 'MMMM d, yyyy')
                  : 'N/A'
                }
              </p>
            </div>
            {user?.hire_date && (
              <div>
                <p className="text-sm text-slate-500">Hire Date</p>
                <p className="font-medium text-slate-900 mt-1">
                  {format(parseISO(user.hire_date), 'MMMM d, yyyy')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}