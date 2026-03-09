import PhotographerList from "@/components/PhotographerList";
import { mockPhotographers } from "@/data/mockData";

const Team = () => {
  const available = mockPhotographers.filter((p) => p.available).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Photography Team</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {available} of {mockPhotographers.length} members available for assignments.
        </p>
      </div>

      <PhotographerList />
    </div>
  );
};

export default Team;
