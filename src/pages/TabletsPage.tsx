import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { 
  Search, 
  Filter, 
  Plus,
  Tablet,
  Battery,
  Signal,
  MapPin,
  User,
  Calendar
} from "lucide-react";

const TabletsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock tablet data
  const tablets = [
    {
      id: "TB-001",
      model: "Samsung Galaxy Tab S8",
      serialNumber: "SM-X706B123456",
      simCard: "89001234567890123456",
      status: "active",
      batteryLevel: 85,
      signalStrength: 4,
      assignedWorker: "John Smith",
      project: "Site Survey Project",
      lastSync: "2 hours ago",
      location: "Downtown Site A"
    },
    {
      id: "TB-002", 
      model: "Samsung Galaxy Tab A8",
      serialNumber: "SM-X200B654321",
      simCard: "89001234567890123457",
      status: "active",
      batteryLevel: 92,
      signalStrength: 5,
      assignedWorker: "Sarah Johnson",
      project: "Environmental Survey",
      lastSync: "1 hour ago",
      location: "Forest Site B"
    },
    {
      id: "TB-003",
      model: "Samsung Galaxy Tab S8",
      serialNumber: "SM-X706B789012",
      simCard: "89001234567890123458",
      status: "maintenance",
      batteryLevel: 15,
      signalStrength: 0,
      assignedWorker: null,
      project: null,
      lastSync: "3 days ago",
      location: "IT Department"
    },
    {
      id: "TB-004",
      model: "Samsung Galaxy Tab A8",
      serialNumber: "SM-X200B345678",
      simCard: "89001234567890123459",
      status: "inactive",
      batteryLevel: 100,
      signalStrength: 0,
      assignedWorker: null,
      project: null,
      lastSync: "Never",
      location: "Storage Room"
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-status-active text-success-foreground';
      case 'inactive': return 'bg-status-inactive text-white';
      case 'maintenance': return 'bg-status-maintenance text-warning-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getSignalBars = (strength: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <div
        key={i}
        className={`w-1 h-3 rounded-sm ${
          i < strength ? 'bg-status-active' : 'bg-muted'
        }`}
      />
    ));
  };

  const filteredTablets = tablets.filter(tablet =>
    tablet.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tablet.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tablet.assignedWorker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tablet.project?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Tablet Management</h1>
              <p className="text-muted-foreground">Manage your Samsung tablet fleet</p>
            </div>
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="h-4 w-4 mr-2" />
              Add New Tablet
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tablets by ID, model, worker, or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="sm:w-auto">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Tablets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTablets.map((tablet) => (
              <Card key={tablet.id} className="bg-gradient-to-br from-card to-secondary/20 border shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Tablet className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg font-semibold">{tablet.id}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(tablet.status)}>
                      {tablet.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{tablet.model}</p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Battery and Signal */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Battery className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{tablet.batteryLevel}%</span>
                      <div className={`w-8 h-2 rounded-full border border-muted ${
                        tablet.batteryLevel > 20 ? 'bg-status-active' : 'bg-destructive'
                      }`} style={{ 
                        background: `linear-gradient(to right, ${
                          tablet.batteryLevel > 20 ? 'hsl(var(--status-active))' : 'hsl(var(--destructive))'
                        } ${tablet.batteryLevel}%, hsl(var(--muted)) ${tablet.batteryLevel}%)`
                      }} />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Signal className="h-4 w-4 text-muted-foreground" />
                      <div className="flex space-x-px">
                        {getSignalBars(tablet.signalStrength)}
                      </div>
                    </div>
                  </div>

                  {/* Assignment Info */}
                  {tablet.assignedWorker ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{tablet.assignedWorker}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{tablet.project}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">
                      Unassigned
                    </div>
                  )}

                  {/* Device Info */}
                  <div className="pt-2 border-t border-border space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Serial:</span>
                      <span className="font-mono">{tablet.serialNumber}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>SIM:</span>
                      <span className="font-mono">{tablet.simCard}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Last Sync:</span>
                      <span>{tablet.lastSync}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Location:</span>
                      <span>{tablet.location}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Locate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTablets.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Tablet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">No tablets found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search criteria or add a new tablet.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default TabletsPage;