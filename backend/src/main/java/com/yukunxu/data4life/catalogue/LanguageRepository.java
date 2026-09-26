package com.yukunxu.data4life.catalogue;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LanguageRepository extends JpaRepository<Language, Long> {

    List<Language> findAllByOrderByNameAsc();
}
