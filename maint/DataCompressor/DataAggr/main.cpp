#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <sstream>

using namespace std;

string ZeroPadNumber(int num)
{
	stringstream ss;
	
	// the number is converted to string with the help of stringstream
	ss << num; 
	string ret;
	ss >> ret;
	
	// Append zero chars
	int str_length = ret.length();
	for (int i = 0; i < 5 - str_length; i++)
		ret = "0" + ret;
	return ret;
}

int from_string(std::string const & s) {
    std::stringstream ss(s);
    int result;
    ss >> result;    // TODO handle errors
    return result;
}
double from_string_doub(std::string const & s) {
    std::stringstream ss(s);
    double result;
    ss >> result;    // TODO handle errors
    return result;
}
std::vector<std::string> &split(const std::string &s, char delim, std::vector<std::string> &elems) {
    std::stringstream ss(s);
    std::string item;
    while (std::getline(ss, item, delim)) {
        elems.push_back(item);
    }
    return elems;
}


std::vector<std::string> split(const std::string &s, char delim) {
    std::vector<std::string> elems;
    split(s, delim, elems);
    return elems;
}

int main()
{
	ifstream fin("zip5equiv.in");
	ofstream fout("sortedfipzip.out");
	int toSpecial[]={2275,13069,13299,13219,13155,13277,13319,13103,13215,13259,13123,13271,13195,13301,13303,13293,13317,13307,0,18075,19117,31145,20093,20093,20203,20175,20203,21239,21221,21187,21057,21201,27095,28159,28131,29179,29117,30107,31091,31165,31175,37197,38041,46063,45075,46043,46119,47143,47177,48191,48487,48191,48459,48381,48191,48465,48317,48269,48329,48421,48483,48505};
	int fromSpecial[]={2198,13003,13005,13013,13017,13019,13023,13029,13053,13061,13085,13091,13105,13125,13141,13171,13181,13197,15005,18009,19039,20039,20055,20067,20071,20081,20109,21005,21033,21041,21053,21097,27065,28019,28039,29035,29079,30037,31005,31013,31071,37003,38001,38011,45017,46035,46065,47007,47015,48011,48023,48045,48063,48065,48075,48105,48115,48155,48173,48195,48211,48247};
	cout<<"Genarating FIPS-ZIP Database....";
	if(true)
	{
		vector<int> Fipvals, Zipvals;
		string s;
		vector<string> converted;
		fout<<"FIPS "<<" ZIP";
		while(!fin.eof())
		{
			fin>>s;
			converted=split(s,',');
			Fipvals.push_back(from_string(converted[1]));
			Zipvals.push_back(from_string(converted[0]));
			fout<<endl<<converted[1]<<' '<<converted[0];
		}
		if(Fipvals.size()!=Zipvals.size())
			cout<<"SIZE ERROR";
		cout<<"\nFIPS-ZIP Database Complete\n";
		cout<<"Indexing ZIP Values...\n";
		fin.close();
		fout.close();
		fout.open("sortedfipzip.out");
		int numtimes=Fipvals.size();
		vector<int> zipfips(100000,-10);
		for(int j=0;j<numtimes;j++)
			zipfips[Zipvals[j]]=Fipvals[j];
		fout<<"ZIP   FIPS";
		for(int j=0;j<100000;j++)
		{
			if(zipfips[j]>0)
				fout<<endl<<ZeroPadNumber(j)<<" "<<ZeroPadNumber(zipfips[j]);
		}
		cout<<"Indexing Complete\n";
	}
	
	cout<<"Indexing FIPS....\n";
	fin.close();
	fout.close();
	vector<int> fipIndex(100000,-10);
	if(true)
	{
		fin.open("sortedfipzip.out");
		string s;
		fin>>s>>s;
		int b;
		for(int j=0;!fin.eof();j++)
		{
			fin>>b>>b;
			fipIndex[b]=j;
		}
	}
	fout.open("fiplist.out");
	for(int j=0;j<100000;j++)
		if(fipIndex[j]>=0)
			fout<<ZeroPadNumber(j)<<", ";
	
	cout<<"Indexing Complete\n";
	cout<<"Prepping Output Table....\n";
	fin.close();
	fout.close();
	fout.open("processed.json");
	int numCheck=0;
	for(int j=0;j<100000;j++)
	{
		if(fipIndex[j]>-1)
		{
			numCheck++;
		}
	}
	cout<<"Output table ready\n";
	cout<<"Processing Census Data (DataSet.txt)....\n";
	
	//population
	cout<<"     Population....\n";
	if(true)
	{
		fin.close();
		fin.open("DataSet.txt");
		string s;
		fin>>s;
		fout<<"[{\"name\":\"Population\",\"type\":\"POP\",\"super\":\"N\",\"data\":{\"trash\":\"trash\"";
		vector<string> separated;
		vector<int> censusData(100000,-10);
		while(!fin.eof())
		{
			fin>>s;
			separated=split(s,',');
			if(from_string(separated[0])%1000>0)
			{
				int curfip= from_string(separated[0]);
				censusData[curfip]=from_string(separated[1]);
			}
		}
		for(int j=0;j<100000;j++)
		{
			if(censusData[j]<0&&fipIndex[j]>=0)
				cout<<"FIP: "<<j<<" census: "<<censusData[j]<<" fipIndex: "<<fipIndex[j]<<endl;
			else if(fipIndex[j]<0&&censusData[j]>=0)
			{
				int k;
				for(k=0;fromSpecial[k]<j;k++);
				if(fromSpecial[k]==j)
					censusData[toSpecial[k]]+=censusData[fromSpecial[k]];
				else
					cout<<"FIP: "<<j<<" census: "<<censusData[j]<<" fipIndex: "<<fipIndex[j]<<endl;
			}
			else if(censusData[j]>=0&&fipIndex[j]>=0)
				fout<<",\"fip"<<j<<"\":"<<censusData[j];
		}
		fout<<"}},";
	}
	
	//Age distribution
	cout<<"     Age Distribution....\n";
	if(true)
	{
		vector<double> pct18_64(100000,100);
		vector<double> pct5_18(100000,0);
		string names[]={"5-","5-18","65+","18-65"};
		for(int i=0;i<3;i++)
		{
			fin.close();
			fin.open("DataSet.txt");
			string s;
			fin>>s;
			fout<<"\n{\"name\":\""<<names[i]<<"\",\"type\":\"PCT\",\"super\":\"AGE\",\"data\":{\"trash\":\"trash\"";
			vector<string> separated;
			vector<double> censusData(100000,-10);
			while(!fin.eof())
			{
				fin>>s;
				separated=split(s,',');
				if(from_string(separated[0])%1000>0)
				{
					int curfip= from_string(separated[0]);
					if(censusData[curfip]>0)
						continue;
					censusData[curfip]=from_string_doub(separated[i+7]);
					
					if(i==0)
						pct5_18[curfip]-=censusData[curfip];
					else if(i==1)
						pct5_18[curfip]+=censusData[curfip];
					if(i!=0)
						pct18_64[curfip]-=censusData[curfip];
				}
			}
			for(int j=0;j<100000;j++)
			{
				if(censusData[j]<0&&fipIndex[j]>=0)
					cout<<"FIP: "<<j<<" census: "<<censusData[j]<<" fipIndex: "<<fipIndex[j]<<endl;
				else if(fipIndex[j]<0&&censusData[j]>=0)
				{
					int k;
					for(k=0;fromSpecial[k]<j;k++);
					if(fromSpecial[k]==j)
						pct18_64[j]=100;
					else
						cout<<"FIP: "<<j<<" census: "<<censusData[j]<<" fipIndex: "<<fipIndex[j]<<endl;
				}
				else if(censusData[j]>=0&&fipIndex[j]>=0)
				{
					if(i!=1)
						fout<<",\"fip"<<j<<"\":"<<censusData[j];
					else
						fout<<",\"fip"<<j<<"\":"<<pct5_18[j];
				}
			}
			fout<<"}},";
		}
		fout<<"\n{\"name\":\"18-64\",\"type\":\"PCT\",\"super\":\"AGE\",\"data\":{\"trash\":\"trash\"";
		for(int j=0;j<100000;j++)
		{
			if(pct18_64[j]<100)
			{
				if(fipIndex[j]>0)
					fout<<",\"fip"<<j<<"\":"<<pct18_64[j];
				else
					cout<<endl<<j<<" "<<pct18_64[j];
			}
		}
		fout<<"}},";
	}
	cout<<"     Gender....\n";
	
	//gender
	if(true)
	{
		fin.close();
		fin.open("DataSet.txt");
		string s;
		fin>>s;
		fout<<"\n{\"name\":\"Female\",\"type\":\"PCT\",\"super\":\"Gender\",\"data\":{\"trash\":\"trash\"";
		vector<string> separated;
		vector<double> censusData(100000,-10);
		vector<double> males(100000,100);
		while(!fin.eof())
		{
			fin>>s;
			separated=split(s,',');
			if(from_string(separated[0])%1000>0)
			{
				int curfip= from_string(separated[0]);
				if(censusData[curfip]>0)
					continue;
				censusData[curfip]=from_string_doub(separated[10]);
				males[curfip]-=censusData[curfip];
			}
		}
		for(int j=0;j<100000;j++)
		{
			if(censusData[j]<0&&fipIndex[j]>=0)
				cout<<"FIP: "<<j<<" census: "<<censusData[j]<<" fipIndex: "<<fipIndex[j]<<endl;
			else if(fipIndex[j]<0&&censusData[j]>=0)
			{
				int k;
				for(k=0;fromSpecial[k]<j;k++);
				if(fromSpecial[k]==j)
					males[j]=100;
				else
					cout<<"FIP: "<<j<<" census: "<<censusData[j]<<" fipIndex: "<<fipIndex[j]<<endl;
			}
			else if(censusData[j]>=0&&fipIndex[j]>=0)
				fout<<",\"fip"<<j<<"\":"<<censusData[j];
		}
		fout<<"}},";
		fout<<"\n{\"name\":\"Male\",\"type\":\"PCT\",\"super\":\"Gender\",\"data\":{\"trash\":\"trash\"";
		for(int j=0;j<100000;j++)
		{
			if(males[j]<100)
				fout<<",\"fip"<<j<<"\":"<<males[j];
		}
	}
	
	//Race
	cout<<"     Race....\n";
	if(true)
	{
		vector<double> other(100000,100);
		vector <double> hisp(100000,100);
		string races[]={"ERROR","Black","Native_American","Asian","Pacific_Islander","ERROR","Hispanic","White"};
		for(int i=0;i<8;i++)
		{
			if(i==5||i==6)
				continue;
			fin.close();
			fin.open("DataSet.txt");
			string s;
			fin>>s;
			if(i!=0)
				fout<<"\n{\"name\":\""<<races[i]<<"\",\"type\":\"PCT\",\"super\":\"Race\",\"data\":{\"trash\":\"trash\"";
			vector<string> separated;
			vector<double> censusData(100000,-10);
			while(!fin.eof())
			{
				fin>>s;
				separated=split(s,',');
				if(from_string(separated[0])%1000>0)
				{
					int curfip= from_string(separated[0]);
					if(censusData[curfip]>0)
						continue;
					censusData[curfip]=from_string_doub(separated[11+i]);
					if(i==0)
						hisp[curfip]=censusData[curfip];
					if(i!=7)
						other[curfip]-=censusData[curfip];
					else
						hisp[curfip]-=censusData[curfip];
				}
			}
			if(i!=0)
			for(int j=0;j<100000;j++)
			{
				if(censusData[j]<0&&fipIndex[j]>=0)
					cout<<"FIP: "<<j<<" census: "<<censusData[j]<<" fipIndex: "<<fipIndex[j]<<endl;
				else if(fipIndex[j]<0&&censusData[j]>=0)
				{
					int k;
					for(k=0;fromSpecial[k]<j;k++);
					if(fromSpecial[k]==j)
					{
						other[j]=100;
						hisp[j]=100;
					}
					else
						cout<<"FIP: "<<j<<" census: "<<censusData[j]<<" fipIndex: "<<fipIndex[j]<<endl;
				}
				else if(censusData[j]>=0&&fipIndex[j]>=0)
					fout<<",\"fip"<<j<<"\":"<<censusData[j];
			}
			fout<<"}},";
		}
		fout<<"\n{\"name\":\"Hispanic\",\"type\":\"PCT\",\"super\":\"Race\",\"data\":{\"trash\":\"trash\"";
		for(int j=0;j<100000;j++)
		{
			if(hisp[j]<100)
				fout<<",\"fip"<<j<<"\":"<<hisp[j];
		}
		fout<<"}},";
		fout<<"\n{\"name\":\"Other\",\"type\":\"PCT\",\"super\":\"Race\",\"data\":{\"trash\":\"trash\"";
		for(int j=0;j<100000;j++)
		{
			if(other[j]<100)
				fout<<",\"fip"<<j<<"\":"<<other[j];
		}
		fout<<"}},";
	}
	
	//travel time
	cout<<"     Commute....\n";
	if(true)
	{
		fin.close();
		fin.open("DataSet.txt");
		string s;
		fin>>s;
		fout<<"\n{\"name\":\"Average_Commute_Time\",\"type\":\"ABS\",\"super\":\"N\",\"data\":{\"trash\":\"trash\"";
		vector<string> separated;
		vector<int> censusData(100000,-10);
		while(!fin.eof())
		{
			fin>>s;
			separated=split(s,',');
			if(from_string(separated[0])%1000>0)
			{
				int curfip= from_string(separated[0]);
				censusData[curfip]=from_string(separated[25]);
			}
		}
		for(int j=0;j<100000;j++)
		{
			if(censusData[j]<0&&fipIndex[j]>=0)
				cout<<"FIP: "<<j<<" census: "<<censusData[j]<<" fipIndex: "<<fipIndex[j]<<endl;
			else if(fipIndex[j]<0&&censusData[j]>=0)
			{
				int k;
				for(k=0;fromSpecial[k]<j;k++);
				if(fromSpecial[k]==j);
				else
					cout<<"FIP: "<<j<<" census: "<<censusData[j]<<" fipIndex: "<<fipIndex[j]<<endl;
			}
			else if(censusData[j]>=0&&fipIndex[j]>=0)
				fout<<",\"fip"<<j<<"\":"<<censusData[j];
		}
		fout<<"}},";
	}
	
	//Retail Sales
	cout<<"     Retail Sales....\n";
	if(true)
	{
		fin.close();
		fin.open("DataSet.txt");
		string s;
		fin>>s;
		fout<<"\n{\"name\":\"Retail_Sales_Per_Capita\",\"type\":\"ABS\",\"super\":\"N\",\"data\":{\"trash\":\"trash\"";
		vector<string> separated;
		vector<int> censusData(100000,-10);
		while(!fin.eof())
		{
			fin>>s;
			separated=split(s,',');
			if(from_string(separated[0])%1000>0)
			{
				int curfip= from_string(separated[0]);
				censusData[curfip]=from_string(separated[49]);
			}
		}
		for(int j=0;j<100000;j++)
		{
			if(censusData[j]<0&&fipIndex[j]>=0)
				cout<<"FIP: "<<j<<" census: "<<censusData[j]<<" fipIndex: "<<fipIndex[j]<<endl;
			else if(fipIndex[j]<0&&censusData[j]>=0)
			{
				int k;
				for(k=0;fromSpecial[k]<j;k++);
				if(fromSpecial[k]==j);
				else
					cout<<"FIP: "<<j<<" census: "<<censusData[j]<<" fipIndex: "<<fipIndex[j]<<endl;
			}
			else if(censusData[j]>=0&&fipIndex[j]>=0)
				fout<<",\"fip"<<j<<"\":"<<censusData[j];
		}
		fout<<"}},";
	}
	
	//population density
	cout<<"     Population Density....\n";
	if(true)
	{
		fin.close();
		fin.open("DataSet.txt");
		string s;
		fin>>s;
		fout<<"\n{\"name\":\"Population_Density\",\"type\":\"ABS\",\"super\":\"N\",\"data\":{\"trash\":\"trash\"";
		vector<string> separated;
		vector<double> censusData(100000,-10);
		while(!fin.eof())
		{
			fin>>s;
			separated=split(s,',');
			if(from_string(separated[0])%1000>0)
			{
				int curfip= from_string(separated[0]);
				censusData[curfip]=from_string_doub(separated[53]);
			}
		}
		for(int j=0;j<100000;j++)
		{
			if(censusData[j]<0&&fipIndex[j]>=0)
				cout<<"FIP: "<<j<<" census: "<<censusData[j]<<" fipIndex: "<<fipIndex[j]<<endl;
			else if(fipIndex[j]<0&&censusData[j]>=0)
			{
				int k;
				for(k=0;fromSpecial[k]<j;k++);
				if(fromSpecial[k]==j);
				else
					cout<<"FIP: "<<j<<" census: "<<censusData[j]<<" fipIndex: "<<fipIndex[j]<<endl;
			}
			else if(censusData[j]>=0&&fipIndex[j]>=0)
				fout<<",\"fip"<<j<<"\":"<<censusData[j];
		}
		fout<<"}},";
	}
	//education
	cout<<"     Education....\n";
	if(true)
	{
		vector<double> dropout(100000,100);
		vector<double> highschool(100000,-10);
		fin.close();
		fin.open("DataSet.txt");
		string s;
		fin>>s;
		fout<<"\n{\"name\":\"Bachelor's_or_Higher\",\"type\":\"PCT\",\"super\":\"Highest_Level_of_Education\",\"data\":{\"trash\":\"trash\"";
		vector<string> separated;
		vector<double> censusData(100000,-10);
		while(!fin.eof())
		{
			fin>>s;
			separated=split(s,',');
			if(from_string(separated[0])%1000>0)
			{
				int curfip= from_string(separated[0]);
				censusData[curfip]=from_string_doub(separated[23]);
				highschool[curfip]=from_string_doub(separated[22])-censusData[curfip];
				dropout[curfip]-=highschool[curfip]+censusData[curfip];
			}
		}
		for(int j=0;j<100000;j++)
		{
			if(censusData[j]<0&&fipIndex[j]>=0)
				cout<<"FIP: "<<j<<" census: "<<censusData[j]<<" fipIndex: "<<fipIndex[j]<<endl;
			else if(fipIndex[j]<0&&censusData[j]>=0)
			{
				int k;
				for(k=0;fromSpecial[k]<j;k++);
				if(fromSpecial[k]==j)
				{
					highschool[j]=-10;
					dropout[j]=100;
				}
				else
					cout<<"FIP: "<<j<<" census: "<<censusData[j]<<" fipIndex: "<<fipIndex[j]<<endl;
			}
			else if(censusData[j]>=0&&fipIndex[j]>=0)
				fout<<",\"fip"<<j<<"\":"<<censusData[j];
		}
		fout<<"}},";
		fout<<"\n{\"name\":\"Highschool\",\"type\":\"PCT\",\"super\":\"Highest_Level_of_Education\",\"data\":{\"trash\":\"trash\"";
		for(int j=0;j<100000;j++)
		{
			if(highschool[j]>=0)
				fout<<",\"fip"<<j<<"\":"<<highschool[j];
		}
		fout<<"}},";
		fout<<"\n{\"name\":\"Dropout\",\"type\":\"PCT\",\"super\":\"Highest_Level_of_Education\",\"data\":{\"trash\":\"trash\"";
		for(int j=0;j<100000;j++)
		{
			if(dropout[j]<100)
				fout<<",\"fip"<<j<<"\":"<<dropout[j];
		}
		fout<<"}},";
	}
	
	//income
	cout<<"     Income....\n";
	if(true)
	{
		fin.close();
		fin.open("DataSet.txt");
		string s;
		fin>>s;
		fout<<"\n{\"name\":\"Income_Per_Capita\",\"type\":\"ABS\",\"super\":\"N\",\"data\":{\"trash\":\"trash\"";
		vector<string> separated;
		vector<int> censusData(100000,-10);
		while(!fin.eof())
		{
			fin>>s;
			separated=split(s,',');
			if(from_string(separated[0])%1000>0)
			{
				int curfip= from_string(separated[0]);
				censusData[curfip]=from_string(separated[32]);
			}
		}
		for(int j=0;j<100000;j++)
		{
			if(censusData[j]<0&&fipIndex[j]>=0)
				cout<<"FIP: "<<j<<" census: "<<censusData[j]<<" fipIndex: "<<fipIndex[j]<<endl;
			else if(fipIndex[j]<0&&censusData[j]>=0)
			{
				int k;
				for(k=0;fromSpecial[k]<j;k++);
				if(fromSpecial[k]==j)
					censusData[toSpecial[k]]+=censusData[fromSpecial[k]];
				else
					cout<<"FIP: "<<j<<" census: "<<censusData[j]<<" fipIndex: "<<fipIndex[j]<<endl;
			}
			else if(censusData[j]>=0&&fipIndex[j]>=0)
				fout<<",\"fip"<<j<<"\":"<<censusData[j];
		}
		fout<<"}}";
	}
	
	cout<<"Census Data Complete\n";
	cout<<"Processing Medicare Data (PhysicianData.in)....\n";
	fin.close();
	if(true)
	{
		fin.open("PhysicianData.in");
		for(int j=0;j<30;j++)
		{
			string s;
			fin>>s;
		}
		for(int j=0;j<20;j++)
		{
			string s;
			fin>>s;
			cout<<s<<endl<<endl;
		}
	}
	
	cout<<"Medicare Data Complete\n";
	cout<<"PROGRAM COMPLETE";
	fout<<']';
	return 0;
}