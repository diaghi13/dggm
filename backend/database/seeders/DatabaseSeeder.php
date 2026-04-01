<?php

namespace Database\Seeders;

use App\Models\Landlord\GlobalUser;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed roles and permissions first
        $this->call([
            //            RoleAndPermissionSeeder::class,
            //            DiscountFamilySeeder::class,
            //            PaymentTermSeeder::class,
            //            ProductCategorySeeder::class,
            //            ProductRelationTypeSeeder::class,
            //            SettingSeeder::class,
            //            AppSettingsSeeder::class,
            //            CompanySettingsSeeder::class,
            //            QuoteSettingsSeeder::class,
            //            ProjectRoleSeeder::class,
            //            WarrantyTypeSeeder::class,
            //            RentalProfileSeeder::class,
        ]);

        $superAdmin = GlobalUser::firstOrCreate(
            ['email' => 'davide.d.donghi@gmail.com'],
            [
                'name' => 'Davide Donghi',
                'password' => Hash::make('Imbues0868$'),
                'is_landlord_admin' => true,
            ]
        );

        // Create a super admin user
        //        $superAdmin = User::firstOrCreate(
        //            ['email' => 'admin@dggm.com'],
        //            [
        //                'name' => 'Super Admin',
        //                'password' => Hash::make('password'),
        //            ]
        //        );
        //        $superAdmin->assignRole('super-admin');
        // Create test users for each rolefdfd
        //        $projectManager = User::firstOrCreate(
        //            ['email' => 'pm@dggm.com'],
        //            [
        //                'name' => 'Project Manager',
        //                'password' => Hash::make('password'),
        //            ]
        //        );
        //        $projectManager->assignRole('project-manager');

        //        $worker = User::firstOrCreate(
        //            ['email' => 'worker@dggm.com'],
        //            [
        //                'name' => 'Worker',
        //                'password' => Hash::make('password'),
        //            ]
        //        );
        //        $worker->assignRole('worker');

        //        $this->command?->info('Database seeded successfully!');
        //        $this->command?->info('Super Admin: admin@dggm.com / password');
        //        $this->command?->info('Project Manager: pm@dggm.com / password');
        //        $this->command?->info('Worker: worker@dggm.com / password');
    }
}
