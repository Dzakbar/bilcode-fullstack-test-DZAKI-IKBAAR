<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $renamedColumn = false;

        if (Schema::hasColumn('clients', 'contact') && ! Schema::hasColumn('clients', 'email')) {
            Schema::table('clients', function (Blueprint $table): void {
                $table->renameColumn('contact', 'email');
            });

            $renamedColumn = true;
        }

        if ($renamedColumn && Schema::hasColumn('clients', 'email')) {
            Schema::table('clients', function (Blueprint $table): void {
                $table->unique('email');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('clients', 'email')) {
            Schema::table('clients', function (Blueprint $table): void {
                $table->dropUnique(['email']);
            });
        }

        if (Schema::hasColumn('clients', 'email') && ! Schema::hasColumn('clients', 'contact')) {
            Schema::table('clients', function (Blueprint $table): void {
                $table->renameColumn('email', 'contact');
            });
        }
    }
};
