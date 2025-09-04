import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, UserPlus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import EmployeeModal from "@/components/EmployeeModal";

interface Employee {
  id: string;
  user_id: string;
  name: string;
  employee_id: string;
  position: string;
  department: string;
  role: 'admin' | 'employee';
  created_at: string;
}

const EmployeeManagementPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Add a test function to verify admin permissions
  const testAdminPermissions = async () => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      console.log('Current user:', currentUser.user?.id);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', currentUser.user?.id)
        .single();
      
      console.log('User profile:', profile);
      
      // Test if we can view all profiles (admin privilege)
      const { data: allProfiles, error } = await supabase
        .from('profiles')
        .select('id, name, role')
        .limit(5);
      
      console.log('Can view all profiles:', !error, allProfiles);
      
      if (error) {
        console.error('Error viewing profiles:', error);
      }
    } catch (error) {
      console.error('Permission test error:', error);
    }
  };

  // Call test function on component mount (for debugging)
  useEffect(() => {
    testAdminPermissions();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      // Check admin status first
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('User not authenticated');
      }

      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', currentUser.user.id)
        .single();

      if (currentProfile?.role !== 'admin') {
        throw new Error('Access denied: Admin privileges required');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      console.error('Fetch employees error:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengambil data pegawai",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus pegawai ini?")) return;

    try {
      console.log('Starting delete process for user:', userId);
      
      // Verify current user is admin
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('User not authenticated');
      }

      console.log('Current user ID:', currentUser.user.id);

      // Check admin status
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role, name')
        .eq('user_id', currentUser.user.id)
        .single();

      console.log('Current user profile:', currentProfile);
      
      if (profileError) {
        console.error('Error checking admin role:', profileError);
        throw new Error(`Tidak dapat memverifikasi status admin: ${profileError.message}`);
      }

      if (currentProfile?.role !== 'admin') {
        throw new Error('Anda tidak memiliki izin untuk menghapus pegawai. Role saat ini: ' + (currentProfile?.role || 'tidak ditemukan'));
      }

      // Get the employee to be deleted for logging
      const { data: targetEmployee } = await supabase
        .from('profiles')
        .select('name, employee_id')
        .eq('user_id', userId)
        .single();
      
      console.log('Target employee:', targetEmployee);

      // Attempt to delete the profile
      console.log('Attempting to delete profile...');
      const { error: deleteError, data: deleteData } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId)
        .select(); // Select to see what was deleted
        
      console.log('Delete result:', { error: deleteError, data: deleteData });
        
      if (deleteError) {
        console.error('Delete error details:', deleteError);
        throw new Error(`Gagal menghapus pegawai: ${deleteError.message}`);
      }
      
      if (!deleteData || deleteData.length === 0) {
        throw new Error('Tidak ada data yang dihapus. Pegawai mungkin tidak ditemukan.');
      }
      
      console.log('Delete successful');
      toast({ title: "Berhasil", description: `Pegawai ${targetEmployee?.name || 'Unknown'} berhasil dihapus` });
      await fetchEmployees();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({ 
        title: "Error", 
        description: error.message || 'Gagal menghapus pegawai',
        variant: "destructive" 
      });
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Manajemen Pegawai
            </div>
            <EmployeeModal onSuccess={fetchEmployees}>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Tambah Pegawai
              </Button>
            </EmployeeModal>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cari pegawai berdasarkan nama, ID, atau departemen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">{employees.length}</div>
                <div className="text-sm text-muted-foreground">Total Pegawai</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">
                  {employees.filter(e => e.role === 'admin').length}
                </div>
                <div className="text-sm text-muted-foreground">Admin</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">
                  {employees.filter(e => e.role === 'employee').length}
                </div>
                <div className="text-sm text-muted-foreground">Pegawai</div>
              </CardContent>
            </Card>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>ID Pegawai</TableHead>
                  <TableHead>Posisi</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Tanggal Bergabung</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.employee_id}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>
                      <Badge variant={employee.role === 'admin' ? 'default' : 'secondary'}>
                        {employee.role === 'admin' ? 'Admin' : 'Pegawai'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(employee.created_at).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <EmployeeModal employee={employee} onSuccess={fetchEmployees}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3" />
                          </Button>
                        </EmployeeModal>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(employee.user_id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredEmployees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Tidak ada data pegawai ditemukan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeManagementPage;
